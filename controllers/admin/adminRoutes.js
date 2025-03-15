const {
    Message,
    User,
    Leads,
} = require("../../modals");

const router = require("express").Router();
const bcrypt = require("bcrypt");
const saltRounds = 15;
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
// const { where } = require("sequelize");

const { CPANEL_TOKEN, CPANEL_USERNAME, CPANEL_URL, AWSTATS } = process.env;
const awstatsDir = AWSTATS;

router.get("/newUser", async (req, res) => {
  res.render("createUser");
});

router.post("/logout", (req, res) => {
  if (req.session.logged_in) {
    req.session.destroy(() => {
      res.status(204).end();
    });
  } else {
    res.status(404).end();
  }
});

router.get("/", async (req, res) => {
  if (req.session.logged_in) {
    try {
      const rawStats = await getMostRecentAwstatsFile();
      const myStats = parseAwstatsData(rawStats);

      // Render the admin panel with the stats data, including all sections
      res.render("adminPanel", { myStats });
    } catch (error) {
      console.error(error);
      res.render("adminPanel", {
        myStats: null,
        error: "Error retrieving Awstats data. FR",
      });
    }
  } else {
    res.render("login");
  }
});

//AWS Logic

function getMostRecentAwstatsFile() {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const currentMonthFile = `awstats${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}.txt`;

    // Check for the current month's file explicitly
    const currentMonthPath = path.join(awstatsDir, currentMonthFile);
    if (fs.existsSync(currentMonthPath)) {
      return fs.readFile(currentMonthPath, "utf8", (err, data) => {
        if (err) {
          console.error("Error reading current month Awstats file:", err);
          return reject("Error reading Awstats file for the current month");
        }
        resolve(data);
      });
    }

    // Fallback: Process other files
    fs.readdir(awstatsDir, (err, files) => {
      if (err) {
        console.error("Error reading Awstats directory:", err);
        return reject("Error reading Awstats directory");
      }

      const awstatsFiles = files.filter(
        (file) =>
          file.startsWith("awstats") && file.match(/awstats(\d{6,8})\.txt/)
      );

      if (awstatsFiles.length === 0) {
        return reject("No Awstats files found.");
      }

      const filesWithDates = awstatsFiles
        .map((file) => {
          const dateMatch = file.match(/\d{6,8}/);
          if (!dateMatch) return null;
          const originalDate = dateMatch[0];
          const convertedDate = convertDateToDesiredFormat(originalDate);
          return { file, convertedDate };
        })
        .filter(Boolean);

      filesWithDates.sort((a, b) =>
        b.convertedDate.localeCompare(a.convertedDate)
      );

      const mostRecentFile = filesWithDates[0]?.file;
      if (!mostRecentFile) {
        return reject("No valid Awstats files found.");
      }

      const filePath = path.join(awstatsDir, mostRecentFile);
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          console.error("Error reading Awstats file:", err);
          return reject("Error reading Awstats file");
        }
        resolve(data);
      });
    });
  });
}

function convertDateToDesiredFormat(dateStr) {
  if (dateStr.length === 8) {
    // YYYYMMDD
    return dateStr.slice(4, 6) + dateStr.slice(0, 4); // MMYYYY
  } else if (dateStr.length === 6) {
    // YYYYMM
    return dateStr.slice(4, 6) + dateStr.slice(0, 4); // MMYYYY
  } else if (dateStr.length === 7) {
    // YYYY-MM
    return dateStr.slice(5, 7) + dateStr.slice(0, 4); // MMYYYY
  } else if (dateStr.length === 10) {
    // YYYY-MM-DD
    return dateStr.slice(5, 7) + dateStr.slice(0, 4); // MMYYYY
  }
  console.warn("Unexpected date format:", dateStr); // Log unexpected formats
  return null;
}

function getAwstatsFilesInRange(startDate, endDate) {
  return new Promise((resolve, reject) => {
    fs.readdir(awstatsDir, (err, files) => {
      if (err) {
        console.error("Error reading Awstats directory:", err);
        return reject("Error reading Awstats directory");
      }

      console.log("All AWStats files in directory:", files);

      // Extract start and end months in YYYYMM format
      const startMonth = startDate.slice(0, 6); // YYYYMM
      const endMonth = endDate.slice(0, 6); // YYYYMM

      console.log("Start Month:", startMonth, "End Month:", endMonth);

      // Filter files by MMYYYY format and convert to YYYYMM for comparison
      const filteredFiles = files.filter((file) => {
        const match = file.match(/awstats(\d{6})/); // Match MMYYYY in file name
        if (!match) return false;

        const fileMonthMMYYYY = match[1]; // Extract MMYYYY
        const fileMonthYYYYMM =
          fileMonthMMYYYY.slice(2, 6) + fileMonthMMYYYY.slice(0, 2); // Convert to YYYYMM

        return fileMonthYYYYMM >= startMonth && fileMonthYYYYMM <= endMonth;
      });

      console.log("Filtered AWStats files:", filteredFiles);

      if (filteredFiles.length === 0) {
        return reject("No Awstats files found.");
      }

      // Resolve with full file paths
      resolve(filteredFiles.map((file) => path.join(awstatsDir, file)));
    });
  });
}

function parseAwstatsData(rawData, dateRange = null) {
  const lines = rawData.split("\n");
  const parsedData = {};
  let currentSection = null;

  lines.forEach((line) => {
    line = line.trim();

    // Identify the beginning of a section
    if (line.startsWith("BEGIN_")) {
      currentSection = line.split(" ")[0].split("_")[1].toLowerCase();
      parsedData[currentSection] = [];
      return;
    }

    // Identify the end of a section
    if (line.startsWith("END_")) {
      currentSection = null;
      return;
    }

    // Skip processing for comment lines and empty lines
    if (!currentSection || line.startsWith("#") || line === "") {
      return;
    }

    // Process the `day` section
    if (currentSection === "day") {
      const [date, pages, hits, bandwidth, visits] = line.split(" ");
      if (date && pages && hits && bandwidth && visits) {
        const dayData = { date, pages, hits, bandwidth, visits };

        // Apply date range filtering if provided
        if (dateRange) {
          const [startDate, endDate] = dateRange;

          console.log(
            `Filtering date: ${date} (Range: ${startDate} - ${endDate})`
          );

          // Include only data within the range
          if (date >= startDate && date <= endDate) {
            parsedData[currentSection].push(dayData);
          }
        } else {
          // If no range, include all data
          parsedData[currentSection].push(dayData);
        }
      }
    } else {
      // Process other sections as before
      const sectionHandlers = {
        time: (line) => {
          const [hour, pages, hits, bandwidth] = line.split(" ").slice(0, 4);
          if (hour && pages && hits && bandwidth) {
            parsedData[currentSection].push({ hour, pages, hits, bandwidth });
          }
        },
        filetypes: (line) => {
          const [type, hits, bandwidth] = line.split(" ").slice(0, 3);
          if (type && hits && bandwidth) {
            parsedData[currentSection].push({ type, hits, bandwidth });
          }
        },
        errors: (line) => {
          const [errorCode, hits, bandwidth] = line.split(" ");
          if (errorCode && hits && bandwidth) {
            parsedData[currentSection].push({ errorCode, hits, bandwidth });
          }
        },
        visitor: (line) => {
          const [ip, pages, hits, bandwidth] = line.split(" ").slice(0, 4);
          if (ip && pages && hits && bandwidth) {
            parsedData[currentSection].push({ ip, pages, hits, bandwidth });
          }
        },
        sider: (line) => {
          const [url, pages, bandwidth, entry, exit] = line
            .split(" ")
            .slice(0, 5);
          if (url && pages && bandwidth && entry && exit) {
            parsedData[currentSection].push({
              url,
              pages,
              bandwidth,
              entry,
              exit,
            });
          }
        },
        os: (line) => {
          const [osName, hits] = line.split(" ").slice(0, 2);
          if (osName && hits) {
            parsedData[currentSection].push({ os: osName, hits });
            if (!parsedData.device) {
              parsedData.device = { mobile: 0, desktop: 0 };
            }
            const hitCount = parseInt(hits, 10);
            if (
              osName.toLowerCase().includes("ios") ||
              osName.toLowerCase().includes("android") ||
              osName.toLowerCase().includes("iphone") ||
              osName.toLowerCase().includes("ipad")
            ) {
              parsedData.device.mobile += hitCount;
            } else {
              parsedData.device.desktop += hitCount;
            }
          }
        },
        browser: (line) => {
          const [fullBrowserName, hits, pages] = line.split(" ").slice(0, 3);
          if (fullBrowserName && hits && pages) {
            const browserName = fullBrowserName.split(/[0-9.]/)[0].trim();
            parsedData[currentSection].push({
              browser: browserName,
              hits: parseInt(hits, 10),
              pages: parseInt(pages, 10),
            });
          }
        },
      };

      // Use the appropriate handler for the section
      if (sectionHandlers[currentSection]) {
        sectionHandlers[currentSection](line);
      }
    }
  });

  console.log("Parsed Data:", parsedData); // Log the parsed data for debugging
  return parsedData;
}

// Function to merge duplicate entries by key
function mergeDuplicateEntries(dataArray, key) {
  const mergedData = {};

  dataArray.forEach((item) => {
    const itemKey = item[key];
    if (!mergedData[itemKey]) {
      mergedData[itemKey] = { ...item };
    } else {
      // Sum up numeric values for duplicate entries
      Object.keys(item).forEach((k) => {
        if (k !== key && typeof item[k] === "number") {
          mergedData[itemKey][k] += item[k];
        }
      });
    }
  });

  // Convert mergedData object back to an array
  return Object.values(mergedData);
}

router.get("/adminPanel", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    console.log("Received startDate:", startDate, "endDate:", endDate);

    // Normalize dates to YYYYMMDD format
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);

    console.log(
      "Normalized startDate:",
      normalizedStartDate,
      "endDate:",
      normalizedEndDate
    );

    const filesInRange = await getAwstatsFilesInRange(
      normalizedStartDate,
      normalizedEndDate
    );

    const aggregatedStats = {
      day: [],
      filetypes: [],
      errors: [],
      browser: [],
      os: [],
      device: { mobile: 0, desktop: 0 },
    };

    for (const filePath of filesInRange) {
      const rawStats = await fs.promises.readFile(filePath, "utf8");
      const parsedStats = parseAwstatsData(rawStats, [
        normalizedStartDate,
        normalizedEndDate,
      ]); // Use normalized dates

      // Aggregate each section if data exists
      if (parsedStats.day && parsedStats.day.length > 0)
        aggregatedStats.day.push(...parsedStats.day);
      if (parsedStats.filetypes)
        aggregatedStats.filetypes.push(...parsedStats.filetypes);
      if (parsedStats.errors)
        aggregatedStats.errors.push(...parsedStats.errors);
      if (parsedStats.browser)
        aggregatedStats.browser.push(...parsedStats.browser);
      if (parsedStats.os) aggregatedStats.os.push(...parsedStats.os);

      // Aggregate device data
      if (parsedStats.device) {
        aggregatedStats.device.mobile += parsedStats.device.mobile;
        aggregatedStats.device.desktop += parsedStats.device.desktop;
      }
    }

    // Merge duplicate entries in browser, os, filetypes, and errors sections
    aggregatedStats.browser = mergeDuplicateEntries(
      aggregatedStats.browser,
      "browser"
    );
    aggregatedStats.os = mergeDuplicateEntries(aggregatedStats.os, "os");
    aggregatedStats.filetypes = mergeDuplicateEntries(
      aggregatedStats.filetypes,
      "type"
    );
    aggregatedStats.errors = mergeDuplicateEntries(
      aggregatedStats.errors,
      "errorCode"
    );

    console.log("Aggregated Stats:", aggregatedStats);

    // Handle case where no data matches
    if (aggregatedStats.day.length === 0) {
      return res
        .status(200)
        .json({ message: "No data found for the given date range." });
    }

    res.json(aggregatedStats); // Send all sections in one response object
  } catch (error) {
    console.error("Error in /adminPanel route:", error);
    res.status(500).json({ error: "Error retrieving Awstats data." });
  }
});

function normalizeDate(inputDate) {
  // Ensure input is valid and in YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
    throw new Error(
      `Invalid date format: ${inputDate}. Expected format is YYYY-MM-DD.`
    );
  }
  return inputDate.replace(/-/g, ""); // Convert YYYY-MM-DD to YYYYMMDD
}




//Lead routes

router.get('/leads', async (req, res) => {
  try {
    const { formName } = req.query;
    let filter = {};
    if (formName) filter = { where: { formName } };

    const leadsDB = await Leads.findAll(filter);
    const myLeads= leadsDB.map((lead) => lead.get({ plain: true }));
    const formNamesDB = await Leads.findAll({ attributes: ['formName'], group: ['formName'] });
    const formNames= formNamesDB.map((fname) => fname.get({ plain: true }));
    res.render('adminLeads', { myLeads,formNames });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// router.get('/leads/view/:id', async(req, res) =>{
//   try {
//     const formNameDB = Leads.findOne({where: {id: req.params.id}});

//   }
//   catch(err){
//     res.status(500).send('Server Error')
//   }
// })

// Delete lead route
router.post('/leads/delete/:id', async (req, res) => {
  try {
    await Leads.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/leads');
  } catch (err) {
    res.status(500).send('Server Error'); 
  }
});

module.exports = router;
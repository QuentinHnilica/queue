import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import { mergeAttributes } from "@tiptap/core";

// ✅ Fix: Use TextStyle for font size changes
const FontSize = TextStyle.extend({
    addAttributes() {
        return {
            fontSize: {
                default: null,
                parseHTML: (element) => element.style.fontSize || null,
                renderHTML: (attributes) => {
                    if (!attributes.fontSize) return {};
                    return { style: `font-size: ${attributes.fontSize}` };
                },
            },
        };
    },
});

document.addEventListener("DOMContentLoaded", function () {
    const editorContainer = document.querySelector("#editor-container");
    const initialContent = editorContainer.getAttribute('data-initial-content'); 
    if (!editorContainer) {
        console.error("Tiptap: Editor container not found!");
        return;
    }

    // ✅ Initialize Tiptap Editor
    window.editor = new Editor({
        element: editorContainer,
        extensions: [
            StarterKit.configure({ listItem: false, bulletList: false, orderedList: false }),
            TextStyle, // ✅ Required for inline styles
            FontSize,  // ✅ Fix for font size
            Color,     // ✅ Required for text color
            Link,
            Image,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Underline,
            ListItem,
            BulletList.configure({ HTMLAttributes: { class: "tiptap-bullet-list" } }),
            OrderedList.configure({ HTMLAttributes: { class: "tiptap-ordered-list" }, keepMarks: true, keepAttributes: true }),
        ],
        content: initialContent,
        editorProps: { attributes: { class: "ProseMirror", spellcheck: "true", contenteditable: "true" } },
        onUpdate({ editor }) {
            document.querySelector("#blogContent").value = editor.getHTML();
            updateToolbar();
        },
        onSelectionUpdate() {
            updateToolbar();
        }
    });

    console.log("✅ Tiptap Initialized in Handlebars App!");

    // ✅ Function to update toolbar buttons based on active formatting
    function updateToolbar() {
        if (!window.editor) {
            console.error("❌ window.editor is missing!");
            return;
        }

        const formatButtons = document.querySelectorAll(".format-btn");
        const fontSizeSelector = document.querySelector("#fontSizeSelector");

        formatButtons.forEach(button => {
            const action = button.getAttribute("data-action");
            let isActive = false;

            if (action === "bold") isActive = window.editor.isActive("bold");
            if (action === "italic") isActive = window.editor.isActive("italic");
            if (action === "underline") isActive = window.editor.isActive("underline");
            if (action === "strike") isActive = window.editor.isActive("strike");
            if (action === "bullet-list") isActive = window.editor.isActive("bulletList");
            if (action === "ordered-list") isActive = window.editor.isActive("orderedList");

            if (action === "heading1") isActive = window.editor.isActive("heading", { level: 1 });
            if (action === "heading2") isActive = window.editor.isActive("heading", { level: 2 });
            if (action === "heading3") isActive = window.editor.isActive("heading", { level: 3 });

            button.classList.toggle("is-active", isActive);
        });

        // ✅ Update font size dropdown
        const activeFontSize = window.editor.getAttributes("textStyle")?.fontSize || "";
        fontSizeSelector.value = activeFontSize;
    }

    // ✅ Add event listeners for toolbar buttons
    document.querySelectorAll(".format-btn").forEach(button => {
        button.addEventListener("click", () => {
            const action = button.getAttribute("data-action");

            if (action === "bold") window.editor.chain().focus().toggleBold().run();
            if (action === "italic") window.editor.chain().focus().toggleItalic().run();
            if (action === "underline") window.editor.chain().focus().toggleUnderline().run();
            if (action === "strike") window.editor.chain().focus().toggleStrike().run();
            if (action === "bullet-list") window.editor.chain().focus().toggleBulletList().run();
            if (action === "ordered-list") window.editor.chain().focus().toggleOrderedList().run();
            if (action === "heading1") window.editor.chain().focus().toggleHeading({ level: 1 }).run();
            if (action === "heading2") window.editor.chain().focus().toggleHeading({ level: 2 }).run();
            if (action === "heading3") window.editor.chain().focus().toggleHeading({ level: 3 }).run();
            if (action === "align-left") window.editor.chain().focus().setTextAlign("left").run();
            if (action === "align-center") window.editor.chain().focus().setTextAlign("center").run();
            if (action === "align-right") window.editor.chain().focus().setTextAlign("right").run();
            if (action === "align-justify") window.editor.chain().focus().setTextAlign("justify").run();

            if (action === "link") {
                const url = prompt("Enter the URL:");
                if (url && url.trim() !== "") {
                    window.editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
                } else {
                    window.editor.chain().focus().unsetLink().run();
                }
            }

            if (action === "image") {
                const url = prompt("Enter the image URL:");
                if (url && url.trim() !== "") {
                    window.editor.chain().focus().setImage({ src: url }).run();
                }
            }

            updateToolbar();
        });
    });

    // ✅ Handle text color changes
    document.querySelector("#textColorPicker").addEventListener("input", (event) => {
        const color = event.target.value;
        window.editor.chain().focus().setColor(color).run();
    });

    // ✅ Handle font size changes
    document.querySelector("#fontSizeSelector").addEventListener("change", (event) => {
        const fontSize = event.target.value;
        if (fontSize) {
            window.editor.chain().focus().setMark("textStyle", { fontSize }).run(); // ✅ Corrected font size application
        }
    });


});

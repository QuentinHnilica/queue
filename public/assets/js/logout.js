const logout = async () => {
    const response = await fetch('/admin/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      document.location.replace('/admin');
    } else {
      alert(response.statusText);
    };
  };
    
  document.querySelector('#logout').addEventListener('click', logout);
// Login page JavaScript
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Basic validation
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }

    try {
        console.log('Attempting login with username:', username);
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        console.log('Server response status:', response.status);
        
        const data = await response.json();
        console.log('Server response:', data);

        if (response.ok) {
            // Store user info in session storage
            sessionStorage.setItem('user', JSON.stringify(data.user));
            // Redirect to main application
            window.location.href = '/index.html';
        } else {
            alert(data.error || 'Invalid username or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please check the console for details.');
    }
}

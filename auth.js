// User Authentication Class
class AuthManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn));
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignup(e));
        document.getElementById('forgotPasswordForm').addEventListener('submit', (e) => this.handleForgotPassword(e));

        // Forgot password link
        document.querySelector('.forgot-password').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab(document.querySelector('[data-tab="forgot"]'));
        });

        // Back to login link
        document.querySelector('.back-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab(document.querySelector('[data-tab="login"]'));
        });
    }

    switchTab(btn) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
        document.getElementById('signupForm').classList.toggle('hidden', tab !== 'signup');
        document.getElementById('forgotPasswordForm').classList.toggle('hidden', tab !== 'forgot');
    }

    handleLogin(e) {
        e.preventDefault();
        const identifier = document.getElementById('login-identifier').value;
        const password = document.getElementById('login-password').value;

        const user = this.users.find(u => 
            (u.username === identifier || u.email === identifier) && 
            u.password === password
        );

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'index.html';
        } else {
            this.showMessage('Invalid credentials', 'error');
        }
    }

    handleSignup(e) {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (this.users.some(u => u.username === username)) {
            this.showMessage('Username already exists', 'error');
            return;
        }

        if (this.users.some(u => u.email === email)) {
            this.showMessage('Email already registered', 'error');
            return;
        }

        const newUser = {
            username,
            email,
            password,
            healthData: {
                sleepData: [],
                hydrationData: [],
                exerciseData: [],
                foodData: []
            }
        };

        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));
        
        // Send welcome email
        this.sendEmail(email, 'Welcome to Personal Health Coach', 
            `Welcome ${username}!\n\nYour account has been created successfully.\n\nLogin details:\nUsername: ${username}\nPassword: ${password}\n\nPlease keep these details safe.`);
        
        this.showMessage('Account created successfully! Please check your email for login details.', 'success');
        this.switchTab(document.querySelector('[data-tab="login"]'));
    }

    handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        const user = this.users.find(u => u.email === email);

        if (user) {
            // Send password reset email
            this.sendEmail(email, 'Password Recovery - Personal Health Coach',
                `Hello ${user.username},\n\nYour password is: ${user.password}\n\nPlease keep this information secure.`);
            
            this.showMessage('Password recovery instructions sent to your email', 'success');
        } else {
            this.showMessage('Email not found', 'error');
        }
    }

    sendEmail(to, subject, body) {
        // In a real application, this would send an actual email
        console.log(`Email sent to ${to}:\nSubject: ${subject}\nBody: ${body}`);
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        const authBox = document.querySelector('.auth-box');
        authBox.insertBefore(messageDiv, authBox.firstChild);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && window.location.pathname.endsWith('landing.html')) {
        window.location.href = 'index.html';
    }
}); 
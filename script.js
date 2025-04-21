// HealthTracker class to manage all health-related data
class HealthTracker {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!this.currentUser) {
            window.location.href = 'landing.html';
            return;
        }

        this.userData = JSON.parse(localStorage.getItem('userData')) || {
            users: {}
        };

        if (!this.userData.users[this.currentUser.username]) {
            this.userData.users[this.currentUser.username] = {
                profile: {},
                sleepData: [],
                hydrationData: [],
                exerciseData: []
            };
            this.saveData();
        }
        
        // Initialize week start dates for each tracker
        this.sleepWeekStart = this.getWeekStartDate(new Date());
        this.hydrationWeekStart = this.getWeekStartDate(new Date());
        this.exerciseWeekStart = this.getWeekStartDate(new Date());
        
        this.setupEventListeners();
        this.updateDashboard();
        this.updateWeeklyViews();
    }

    setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('nav button').forEach(button => {
            button.addEventListener('click', () => this.switchSection(button.id));
        });

        // Form submissions
        document.getElementById('saveSleep').addEventListener('click', () => this.saveSleepData());
        document.getElementById('saveHydration').addEventListener('click', () => this.saveHydrationData());
        document.getElementById('saveExercise').addEventListener('click', () => this.saveExerciseData());
        document.getElementById('saveProfile').addEventListener('click', () => this.saveProfileData());

        // Week navigation
        document.getElementById('prevSleepWeek').addEventListener('click', () => this.navigateWeek('sleep', -1));
        document.getElementById('nextSleepWeek').addEventListener('click', () => this.navigateWeek('sleep', 1));
        document.getElementById('prevHydrationWeek').addEventListener('click', () => this.navigateWeek('hydration', -1));
        document.getElementById('nextHydrationWeek').addEventListener('click', () => this.navigateWeek('hydration', 1));
        document.getElementById('prevExerciseWeek').addEventListener('click', () => this.navigateWeek('exercise', -1));
        document.getElementById('nextExerciseWeek').addEventListener('click', () => this.navigateWeek('exercise', 1));

        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('sleepDate').value = today;
        document.getElementById('hydrationDate').value = today;
        document.getElementById('exerciseDate').value = today;

        // Add logout event listener
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    }

    switchSection(buttonId) {
        // Remove active class from all buttons and sections
        document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('main section').forEach(section => section.classList.remove('active-section'));

        // Add active class to clicked button
        document.getElementById(buttonId).classList.add('active');

        // Show corresponding section
        const sectionId = buttonId.replace('Btn', '');
        document.getElementById(sectionId).classList.add('active-section');
    }

    getWeekStartDate(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }

    navigateWeek(tracker, direction) {
        const daysToAdd = direction * 7;
        const weekStart = this[`${tracker}WeekStart`];
        weekStart.setDate(weekStart.getDate() + daysToAdd);
        this.updateWeeklyView(tracker);
    }

    updateWeeklyViews() {
        this.updateWeeklyView('sleep');
        this.updateWeeklyView('hydration');
        this.updateWeeklyView('exercise');
    }

    updateWeeklyView(tracker) {
        const weekStart = this[`${tracker}WeekStart`];
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Update week range display
        document.getElementById(`current${tracker.charAt(0).toUpperCase() + tracker.slice(1)}WeekRange`).textContent = 
            `${this.formatDate(weekStart)} - ${this.formatDate(weekEnd)}`;

        const weeklyEntries = this.userData.users[this.currentUser.username][`${tracker}Data`].filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= weekStart && entryDate <= weekEnd;
        });

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let html = '<div class="weekly-grid">';

        days.forEach((day, index) => {
            const currentDate = new Date(weekStart);
            currentDate.setDate(currentDate.getDate() + index);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            const dayEntries = weeklyEntries.filter(entry => entry.date === dateStr);
            
            html += `
                <div class="day-card">
                    <h4>${day}</h4>
                    <p class="date">${this.formatDate(currentDate)}</p>
                    <div class="day-entries">
                        ${this.getDayEntriesHtml(tracker, dayEntries)}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        document.getElementById(`weekly${tracker.charAt(0).toUpperCase() + tracker.slice(1)}History`).innerHTML = html;
    }

    getDayEntriesHtml(tracker, entries) {
        if (entries.length === 0) {
            return '<p class="no-entries">No entries</p>';
        }

        switch (tracker) {
            case 'sleep':
                return entries.map(entry => `
                    <div class="entry">
                        <span class="hours">${entry.hours} hours</span>
                        <span class="quality">Quality: ${entry.quality}/5</span>
                    </div>
                `).join('');
            
            case 'hydration':
                return entries.map(entry => `
                    <div class="entry">
                        <span class="glasses">${entry.glasses} glasses</span>
                    </div>
                `).join('');
            
            case 'exercise':
                return entries.map(entry => `
                    <div class="entry">
                        <span class="type">${entry.type}</span>
                        <span class="duration">${entry.duration} min</span>
                        <span class="intensity">${entry.intensity}</span>
                    </div>
                `).join('');
        }
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    saveSleepData() {
        const hours = parseFloat(document.getElementById('sleepHours').value);
        const quality = parseInt(document.getElementById('sleepQuality').value);
        const date = document.getElementById('sleepDate').value;

        if (isNaN(hours) || hours < 0 || hours > 24) {
            this.showMessage('Please enter valid sleep hours (0-24)', 'error');
            return;
        }

        const sleepEntry = {
            date,
            hours,
            quality
        };

        this.userData.users[this.currentUser.username].sleepData.push(sleepEntry);
        this.saveData();
        this.updateDashboard();
        this.updateWeeklyView('sleep');
        this.showMessage('Sleep data saved successfully!', 'success');
    }

    saveHydrationData() {
        const glasses = parseInt(document.getElementById('waterGlasses').value);
        const date = document.getElementById('hydrationDate').value;

        if (isNaN(glasses) || glasses < 0) {
            this.showMessage('Please enter a valid number of glasses', 'error');
            return;
        }

        const hydrationEntry = {
            date,
            glasses
        };

        this.userData.users[this.currentUser.username].hydrationData.push(hydrationEntry);
        this.saveData();
        this.updateDashboard();
        this.updateWeeklyView('hydration');
        this.showMessage('Hydration data saved successfully!', 'success');
    }

    saveExerciseData() {
        const type = document.getElementById('exerciseType').value;
        const duration = parseInt(document.getElementById('exerciseDuration').value);
        const intensity = document.getElementById('exerciseIntensity').value;
        const date = document.getElementById('exerciseDate').value;

        if (isNaN(duration) || duration < 0) {
            this.showMessage('Please enter a valid duration', 'error');
            return;
        }

        const exerciseEntry = {
            date,
            type,
            duration,
            intensity
        };

        this.userData.users[this.currentUser.username].exerciseData.push(exerciseEntry);
        this.saveData();
        this.updateDashboard();
        this.updateWeeklyView('exercise');
        this.showMessage('Exercise data saved successfully!', 'success');
    }

    saveProfileData() {
        const profile = {
            name: document.getElementById('userName').value,
            age: parseInt(document.getElementById('userAge').value),
            weight: parseFloat(document.getElementById('userWeight').value),
            height: parseFloat(document.getElementById('userHeight').value)
        };

        this.userData.users[this.currentUser.username].profile = profile;
        this.saveData();
        this.showMessage('Profile updated successfully!', 'success');
    }

    loadProfile() {
        const profile = this.userData.users[this.currentUser.username].profile;
        if (profile) {
            document.getElementById('userName').value = profile.name || '';
            document.getElementById('userAge').value = profile.age || '';
            document.getElementById('userWeight').value = profile.weight || '';
            document.getElementById('userHeight').value = profile.height || '';
        }
    }

    updateDashboard() {
        const userData = this.userData.users[this.currentUser.username];
        const today = new Date().toISOString().split('T')[0];

        const todaySleep = userData.sleepData
            .filter(entry => entry.date.startsWith(today))
            .reduce((sum, entry) => sum + entry.hours, 0);
        
        document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = 
            `${todaySleep.toFixed(1)} hours`;

        const todayHydration = userData.hydrationData
            .filter(entry => entry.date.startsWith(today))
            .reduce((sum, entry) => sum + entry.glasses, 0);
        
        document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = 
            `${todayHydration} glasses`;

        const todayExercise = userData.exerciseData
            .filter(entry => entry.date.startsWith(today))
            .reduce((sum, entry) => sum + entry.duration, 0);
        
        document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = 
            `${todayExercise} minutes`;
    }

    loadHistory() {
        this.loadSleepHistory();
        this.loadHydrationHistory();
        this.loadExerciseHistory();
    }

    loadSleepHistory() {
        const historyContainer = document.getElementById('sleepHistory');
        historyContainer.innerHTML = '';

        const recentEntries = this.userData.users[this.currentUser.username].sleepData
            .slice(-5)
            .reverse()
            .map(entry => {
                const date = new Date(entry.date).toLocaleDateString();
                return `
                    <div class="history-item">
                        <span>${date}</span>
                        <span>${entry.hours} hours (Quality: ${entry.quality}/5)</span>
                    </div>
                `;
            })
            .join('');

        historyContainer.innerHTML = recentEntries || '<p>No sleep data recorded yet</p>';
    }

    loadHydrationHistory() {
        const historyContainer = document.getElementById('hydrationHistory');
        historyContainer.innerHTML = '';

        const recentEntries = this.userData.users[this.currentUser.username].hydrationData
            .slice(-5)
            .reverse()
            .map(entry => {
                const date = new Date(entry.date).toLocaleDateString();
                return `
                    <div class="history-item">
                        <span>${date}</span>
                        <span>${entry.glasses} glasses</span>
                    </div>
                `;
            })
            .join('');

        historyContainer.innerHTML = recentEntries || '<p>No hydration data recorded yet</p>';
    }

    loadExerciseHistory() {
        const historyContainer = document.getElementById('exerciseHistory');
        historyContainer.innerHTML = '';

        const recentEntries = this.userData.users[this.currentUser.username].exerciseData
            .slice(-5)
            .reverse()
            .map(entry => {
                const date = new Date(entry.date).toLocaleDateString();
                return `
                    <div class="history-item">
                        <span>${date}</span>
                        <span>${entry.type} - ${entry.duration} min (${entry.intensity})</span>
                    </div>
                `;
            })
            .join('');

        historyContainer.innerHTML = recentEntries || '<p>No exercise data recorded yet</p>';
    }

    saveData() {
        localStorage.setItem('userData', JSON.stringify(this.userData));
    }

    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'landing.html';
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Food Tracking
class FoodTracker {
    constructor() {
        this.foodEntries = JSON.parse(localStorage.getItem('foodEntries')) || [];
        this.notes = JSON.parse(localStorage.getItem('foodNotes')) || [];
        this.currentWeekStart = this.getWeekStartDate(new Date());
        this.setupEventListeners();
        this.updateWeeklyView();
        this.checkNotifications();
        setInterval(() => this.checkNotifications(), 60000); // Check every minute
    }

    setupEventListeners() {
        document.getElementById('saveFood').addEventListener('click', () => this.saveFoodEntry());
        document.getElementById('prevWeek').addEventListener('click', () => this.navigateWeek(-1));
        document.getElementById('nextWeek').addEventListener('click', () => this.navigateWeek(1));
        document.getElementById('saveNote').addEventListener('click', () => this.saveNote());
        document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('noteDate').value = new Date().toISOString().split('T')[0];
    }

    getWeekStartDate(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }

    navigateWeek(direction) {
        const daysToAdd = direction * 7;
        this.currentWeekStart = new Date(this.currentWeekStart);
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + daysToAdd);
        this.updateWeeklyView();
    }

    saveFoodEntry() {
        const foodName = document.getElementById('foodName').value;
        const calories = parseInt(document.getElementById('calories').value);
        const mealType = document.getElementById('mealType').value;
        const date = document.getElementById('entryDate').value;

        const entry = {
            foodName,
            calories,
            mealType,
            date
        };

        this.foodEntries.push(entry);
        localStorage.setItem('foodEntries', JSON.stringify(this.foodEntries));
        this.updateWeeklyView();
        this.updateDashboard();

        // Clear form
        document.getElementById('foodName').value = '';
        document.getElementById('calories').value = '';
    }

    saveNote() {
        const noteText = document.getElementById('noteText').value;
        const noteDate = document.getElementById('noteDate').value;

        if (!noteText || !noteDate) return;

        const note = {
            text: noteText,
            date: noteDate,
            id: Date.now(),
            notified: false
        };

        this.notes.push(note);
        localStorage.setItem('foodNotes', JSON.stringify(this.notes));
        
        // Clear form
        document.getElementById('noteText').value = '';
        document.getElementById('noteDate').value = new Date().toISOString().split('T')[0];
        
        this.showNotification('Note saved successfully!');
    }

    checkNotifications() {
        const today = new Date().toISOString().split('T')[0];
        const notesToNotify = this.notes.filter(note => 
            note.date === today && !note.notified
        );

        notesToNotify.forEach(note => {
            this.showNotification(note.text);
            note.notified = true;
        });

        if (notesToNotify.length > 0) {
            localStorage.setItem('foodNotes', JSON.stringify(this.notes));
        }
    }

    showNotification(message) {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification("Health Tracker", {
                body: message,
                icon: "icon.png"
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("Health Tracker", {
                        body: message,
                        icon: "icon.png"
                    });
                }
            });
        }
    }

    generateWeeklySuggestions() {
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weeklyEntries = this.foodEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= this.currentWeekStart && entryDate <= weekEnd;
        });

        const suggestions = [];
        const totalCalories = weeklyEntries.reduce((sum, entry) => sum + entry.calories, 0);
        const avgDailyCalories = totalCalories / 7;

        // Analyze meal patterns
        const mealPatterns = {};
        weeklyEntries.forEach(entry => {
            if (!mealPatterns[entry.mealType]) {
                mealPatterns[entry.mealType] = 0;
            }
            mealPatterns[entry.mealType]++;
        });

        // Generate suggestions based on analysis
        if (avgDailyCalories > 2500) {
            suggestions.push("Consider reducing your daily calorie intake. Try to stay within 2000-2500 calories per day.");
        } else if (avgDailyCalories < 1500) {
            suggestions.push("You might be consuming too few calories. Make sure to eat enough to maintain your energy levels.");
        }

        if (!mealPatterns['breakfast'] || mealPatterns['breakfast'] < 3) {
            suggestions.push("Try to have breakfast more regularly. It's important for maintaining energy levels throughout the day.");
        }

        if (mealPatterns['snack'] > 10) {
            suggestions.push("You might be snacking too much. Consider reducing snack frequency and opting for healthier options.");
        }

        // Add variety suggestions
        const uniqueFoods = new Set(weeklyEntries.map(entry => entry.foodName));
        if (uniqueFoods.size < 10) {
            suggestions.push("Try to add more variety to your diet. Include different types of fruits, vegetables, and proteins.");
        }

        // Display suggestions
        const suggestionsHtml = suggestions.length > 0
            ? `<ul>${suggestions.map(s => `<li>${s}</li>`).join('')}</ul>`
            : '<p>Your weekly food intake looks balanced! Keep up the good work.</p>';

        document.getElementById('weeklySuggestions').innerHTML = suggestionsHtml;
    }

    updateWeeklyView() {
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Update week range display
        document.getElementById('currentWeekRange').textContent = 
            `${this.formatDate(this.currentWeekStart)} - ${this.formatDate(weekEnd)}`;

        const weeklyEntries = this.foodEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= this.currentWeekStart && entryDate <= weekEnd;
        });

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let html = '<div class="weekly-grid">';

        days.forEach((day, index) => {
            const currentDate = new Date(this.currentWeekStart);
            currentDate.setDate(currentDate.getDate() + index);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            const dayEntries = weeklyEntries.filter(entry => entry.date === dateStr);
            const totalCalories = dayEntries.reduce((sum, entry) => sum + entry.calories, 0);

            html += `
                <div class="day-card">
                    <h4>${day}</h4>
                    <p class="date">${this.formatDate(currentDate)}</p>
                    <div class="day-entries">
                        ${dayEntries.length > 0 
                            ? dayEntries.map(entry => `
                                <div class="food-entry">
                                    <span class="meal-type">${entry.mealType}</span>
                                    <span class="food-name">${entry.foodName}</span>
                                    <span class="calories">${entry.calories} kcal</span>
                                </div>
                            `).join('')
                            : '<p class="no-entries">No entries</p>'
                        }
                    </div>
                    <div class="day-total">
                        Total: ${totalCalories} kcal
                    </div>
                </div>
            `;
        });

        html += '</div>';

        // Add notes display
        const weekNotes = this.notes.filter(note => {
            const noteDate = new Date(note.date);
            return noteDate >= this.currentWeekStart && noteDate <= weekEnd;
        });

        if (weekNotes.length > 0) {
            html += `
                <div class="week-notes">
                    <h4>Notes for this week:</h4>
                    <ul>
                        ${weekNotes.map(note => `
                            <li>
                                <span class="note-date">${this.formatDate(new Date(note.date))}:</span>
                                <span class="note-text">${note.text}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        // Generate weekly suggestions
        this.generateWeeklySuggestions();

        document.getElementById('weeklyFoodHistory').innerHTML = html;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    calculateDailyCalorieGoal() {
        const profile = JSON.parse(localStorage.getItem('userProfile'));
        if (!profile) return 2000; // Default value

        const { age, weight, height, gender, activityLevel } = profile;
        
        // Calculate BMR using Mifflin-St Jeor Equation
        let bmr;
        if (gender === 'male') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        // Apply activity level multiplier
        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            veryActive: 1.9
        };

        return Math.round(bmr * activityMultipliers[activityLevel]);
    }
}

// Suggestions Generator
class SuggestionsGenerator {
    constructor() {
        this.foodTracker = new FoodTracker();
    }

    generateSuggestions() {
        const profile = JSON.parse(localStorage.getItem('userProfile'));
        if (!profile) return;

        const { age, weight, height, gender, activityLevel } = profile;
        const dailyCalorieGoal = this.foodTracker.calculateDailyCalorieGoal();
        const todayEntries = this.foodTracker.foodEntries.filter(
            entry => entry.date === new Date().toISOString().split('T')[0]
        );
        const totalCalories = todayEntries.reduce((sum, entry) => sum + entry.calories, 0);

        // Generate nutrition suggestions
        const nutritionSuggestions = this.generateNutritionSuggestions(
            totalCalories, dailyCalorieGoal, age, weight
        );
        document.getElementById('nutritionSuggestions').innerHTML = nutritionSuggestions;

        // Generate exercise suggestions
        const exerciseSuggestions = this.generateExerciseSuggestions(
            age, weight, activityLevel
        );
        document.getElementById('exerciseSuggestions').innerHTML = exerciseSuggestions;

        // Generate health insights
        const healthInsights = this.generateHealthInsights(
            age, weight, height, totalCalories, dailyCalorieGoal
        );
        document.getElementById('healthInsights').innerHTML = healthInsights;
    }

    generateNutritionSuggestions(totalCalories, goal, age, weight) {
        let suggestions = [];
        
        if (totalCalories > goal) {
            suggestions.push('You are consuming more calories than your daily goal. Consider reducing portion sizes.');
        } else if (totalCalories < goal * 0.8) {
            suggestions.push('You are consuming fewer calories than recommended. Make sure to eat balanced meals.');
        }

        if (age > 50) {
            suggestions.push('Consider increasing calcium and vitamin D intake for bone health.');
        }

        if (weight > 80) {
            suggestions.push('Focus on incorporating more vegetables and lean proteins into your diet.');
        }

        return suggestions.length > 0 
            ? `<ul>${suggestions.map(s => `<li>${s}</li>`).join('')}</ul>`
            : '<p>Your nutrition intake looks good! Keep up the good work.</p>';
    }

    generateExerciseSuggestions(age, weight, activityLevel) {
        let suggestions = [];
        
        if (activityLevel === 'sedentary') {
            suggestions.push('Start with light activities like walking for 30 minutes daily.');
        } else if (activityLevel === 'light') {
            suggestions.push('Consider adding strength training 2-3 times per week.');
        }

        if (age > 50) {
            suggestions.push('Include balance exercises in your routine to prevent falls.');
        }

        if (weight > 80) {
            suggestions.push('Low-impact exercises like swimming or cycling are great options.');
        }

        return suggestions.length > 0 
            ? `<ul>${suggestions.map(s => `<li>${s}</li>`).join('')}</ul>`
            : '<p>Your exercise routine looks good! Keep challenging yourself.</p>';
    }

    generateHealthInsights(age, weight, height, totalCalories, goal) {
        const bmi = weight / ((height / 100) ** 2);
        let insights = [];

        // BMI insights
        if (bmi < 18.5) {
            insights.push('Your BMI suggests you are underweight. Consider consulting a nutritionist.');
        } else if (bmi > 25) {
            insights.push('Your BMI suggests you are overweight. Focus on balanced diet and regular exercise.');
        }

        // Calorie insights
        const calorieDiff = totalCalories - goal;
        if (Math.abs(calorieDiff) > 200) {
            insights.push(`You are ${calorieDiff > 0 ? 'over' : 'under'} your daily calorie goal by ${Math.abs(calorieDiff)} calories.`);
        }

        // Age-specific insights
        if (age > 50) {
            insights.push('Regular health check-ups are important at your age.');
        }

        return insights.length > 0 
            ? `<ul>${insights.map(i => `<li>${i}</li>`).join('')}</ul>`
            : '<p>Your health metrics look good! Maintain your current lifestyle.</p>';
    }
}

class SuggestionsManager {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('suggestionsBtn').addEventListener('click', () => this.generateAllSuggestions());
    }

    generateAllSuggestions() {
        const userData = this.healthTracker.userData.users[this.healthTracker.currentUser.username];
        const profile = userData.profile;
        
        this.generateHealthSuggestions(profile);
        this.generateNutritionSuggestions(userData, profile);
        this.generateExerciseSuggestions(userData, profile);
        this.generateSleepSuggestions(userData);
        this.generateHydrationSuggestions(userData);
    }

    calculateAgeBasedCalories(age, weight, height, gender, activityLevel) {
        // Calculate BMR using Mifflin-St Jeor Equation
        let bmr;
        if (gender === 'male') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        // Activity level multipliers
        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            veryActive: 1.9
        };

        // Age-based adjustments
        let ageAdjustment = 1;
        if (age >= 60) {
            ageAdjustment = 0.9; // 10% reduction for seniors
        } else if (age >= 50) {
            ageAdjustment = 0.95; // 5% reduction for middle-aged
        }

        return Math.round(bmr * activityMultipliers[activityLevel] * ageAdjustment);
    }

    generateHealthSuggestions(profile) {
        const suggestions = [];
        const bmi = profile.weight / ((profile.height / 100) ** 2);
        const age = profile.age;

        if (bmi < 18.5) {
            suggestions.push("Your BMI suggests you are underweight. Consider consulting a nutritionist.");
        } else if (bmi > 25) {
            suggestions.push("Your BMI suggests you are overweight. Focus on balanced diet and regular exercise.");
        }

        if (age >= 50) {
            suggestions.push("Regular health check-ups are important at your age.");
            suggestions.push("Consider increasing calcium and vitamin D intake for bone health.");
            suggestions.push("Focus on maintaining muscle mass through regular strength training.");
        }

        if (age >= 60) {
            suggestions.push("Consider regular balance exercises to prevent falls.");
            suggestions.push("Stay hydrated and maintain a diet rich in fiber to support digestion.");
        }

        document.getElementById('healthSuggestions').innerHTML = this.formatSuggestions(suggestions);
    }

    generateNutritionSuggestions(userData, profile) {
        const suggestions = [];
        const foodEntries = userData.foodData || [];
        const recentEntries = foodEntries.slice(-7); // Last 7 days
        const age = profile.age;

        const totalCalories = recentEntries.reduce((sum, entry) => sum + entry.calories, 0);
        const avgDailyCalories = totalCalories / 7;
        const recommendedCalories = this.calculateAgeBasedCalories(
            profile.age,
            profile.weight,
            profile.height,
            profile.gender,
            profile.activityLevel
        );

        // Age-specific calorie recommendations
        if (age < 30) {
            if (avgDailyCalories > recommendedCalories) {
                suggestions.push(`As a young adult, aim for around ${recommendedCalories} calories per day. You're currently consuming more than recommended.`);
            } else if (avgDailyCalories < recommendedCalories * 0.8) {
                suggestions.push(`As a young adult, aim for around ${recommendedCalories} calories per day. You might not be consuming enough.`);
            }
        } else if (age >= 30 && age < 50) {
            if (avgDailyCalories > recommendedCalories) {
                suggestions.push(`As an adult, aim for around ${recommendedCalories} calories per day. Consider reducing portion sizes.`);
            }
        } else if (age >= 50) {
            if (avgDailyCalories > recommendedCalories) {
                suggestions.push(`At your age, aim for around ${recommendedCalories} calories per day. Focus on nutrient-dense foods.`);
            }
            suggestions.push("Include more calcium-rich foods and vitamin D for bone health.");
        }

        // Age-specific nutrient recommendations
        if (age >= 50) {
            suggestions.push("Increase intake of fiber-rich foods to support digestion.");
            suggestions.push("Consider adding more omega-3 fatty acids for brain health.");
        }

        if (age >= 60) {
            suggestions.push("Focus on protein-rich foods to maintain muscle mass.");
            suggestions.push("Stay hydrated and include more vitamin B12-rich foods.");
        }

        document.getElementById('nutritionSuggestions').innerHTML = this.formatSuggestions(suggestions);
    }

    generateExerciseSuggestions(userData, profile) {
        const suggestions = [];
        const exerciseEntries = userData.exerciseData || [];
        const recentEntries = exerciseEntries.slice(-7);
        const age = profile.age;

        const totalMinutes = recentEntries.reduce((sum, entry) => sum + entry.duration, 0);
        const avgDailyMinutes = totalMinutes / 7;

        // Age-specific exercise recommendations
        if (age < 30) {
            if (avgDailyMinutes < 30) {
                suggestions.push("Aim for at least 30 minutes of moderate exercise daily. Include both cardio and strength training.");
            }
            suggestions.push("Consider high-intensity interval training (HIIT) for maximum benefits.");
        } else if (age >= 30 && age < 50) {
            if (avgDailyMinutes < 30) {
                suggestions.push("Aim for 30-45 minutes of exercise daily. Focus on maintaining muscle mass and cardiovascular health.");
            }
            suggestions.push("Include strength training 2-3 times per week to prevent muscle loss.");
        } else if (age >= 50) {
            if (avgDailyMinutes < 30) {
                suggestions.push("Aim for 30 minutes of moderate exercise daily. Focus on low-impact activities.");
            }
            suggestions.push("Include balance exercises in your routine to prevent falls.");
            suggestions.push("Consider water-based exercises for joint health.");
        }

        if (age >= 60) {
            suggestions.push("Focus on gentle exercises like walking, swimming, or tai chi.");
            suggestions.push("Include flexibility exercises to maintain range of motion.");
            suggestions.push("Consider chair exercises if you have mobility issues.");
        }

        document.getElementById('exerciseSuggestions').innerHTML = this.formatSuggestions(suggestions);
    }

    generateSleepSuggestions(userData) {
        const suggestions = [];
        const sleepEntries = userData.sleepData || [];
        const recentEntries = sleepEntries.slice(-7);

        const totalHours = recentEntries.reduce((sum, entry) => sum + entry.hours, 0);
        const avgDailyHours = totalHours / 7;

        if (avgDailyHours < 7) {
            suggestions.push("Try to get at least 7 hours of sleep per night for optimal health.");
        }

        const poorQualityNights = recentEntries.filter(entry => entry.quality <= 2).length;
        if (poorQualityNights > 2) {
            suggestions.push("Consider improving your sleep quality by maintaining a consistent sleep schedule and reducing screen time before bed.");
        }

        document.getElementById('sleepSuggestions').innerHTML = this.formatSuggestions(suggestions);
    }

    generateHydrationSuggestions(userData) {
        const suggestions = [];
        const hydrationEntries = userData.hydrationData || [];
        const recentEntries = hydrationEntries.slice(-7);

        const totalGlasses = recentEntries.reduce((sum, entry) => sum + entry.glasses, 0);
        const avgDailyGlasses = totalGlasses / 7;

        if (avgDailyGlasses < 8) {
            suggestions.push("Try to drink at least 8 glasses of water per day.");
        }

        document.getElementById('hydrationSuggestions').innerHTML = this.formatSuggestions(suggestions);
    }

    formatSuggestions(suggestions) {
        return suggestions.length > 0
            ? `<ul>${suggestions.map(s => `<li>${s}</li>`).join('')}</ul>`
            : '<p>No suggestions at this time. Keep up the good work!</p>';
    }
}

class NotesManager {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('personalNotes')) || [];
        this.setupEventListeners();
        this.updateNotesList();
    }

    setupEventListeners() {
        document.getElementById('saveNote').addEventListener('click', () => this.saveNote());
        document.getElementById('filterCategory').addEventListener('change', () => this.updateNotesList());
        document.getElementById('searchNotes').addEventListener('input', () => this.updateNotesList());
    }

    saveNote() {
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;
        const category = document.getElementById('noteCategory').value;

        if (!title || !content) return;

        const note = {
            id: Date.now(),
            title,
            content,
            category,
            date: new Date().toISOString()
        };

        this.notes.push(note);
        localStorage.setItem('personalNotes', JSON.stringify(this.notes));
        
        // Clear form
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        
        this.updateNotesList();
        this.showNotification('Note saved successfully!');
    }

    updateNotesList() {
        const category = document.getElementById('filterCategory').value;
        const searchTerm = document.getElementById('searchNotes').value.toLowerCase();
        
        let filteredNotes = this.notes;
        
        if (category !== 'all') {
            filteredNotes = filteredNotes.filter(note => note.category === category);
        }
        
        if (searchTerm) {
            filteredNotes = filteredNotes.filter(note => 
                note.title.toLowerCase().includes(searchTerm) || 
                note.content.toLowerCase().includes(searchTerm)
            );
        }

        const notesList = document.getElementById('notesList');
        notesList.innerHTML = filteredNotes.length > 0
            ? filteredNotes.map(note => this.createNoteElement(note)).join('')
            : '<p class="no-notes">No notes found</p>';
    }

    createNoteElement(note) {
        return `
            <div class="note-item" data-id="${note.id}">
                <div class="note-header">
                    <h4>${note.title}</h4>
                    <span class="note-category ${note.category}">${note.category}</span>
                </div>
                <div class="note-content">${note.content}</div>
                <div class="note-footer">
                    <span class="note-date">${new Date(note.date).toLocaleDateString()}</span>
                    <button class="delete-note" onclick="notesManager.deleteNote(${note.id})">Delete</button>
                </div>
            </div>
        `;
    }

    deleteNote(id) {
        this.notes = this.notes.filter(note => note.id !== id);
        localStorage.setItem('personalNotes', JSON.stringify(this.notes));
        this.updateNotesList();
    }

    showNotification(message) {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification("Health Tracker", {
                body: message,
                icon: "icon.png"
            });
        }
    }
}

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
    const healthTracker = new HealthTracker();
    const foodTracker = new FoodTracker();
    const suggestionsManager = new SuggestionsManager(healthTracker);
    const notesManager = new NotesManager();

    // Request notification permission
    if ("Notification" in window) {
        Notification.requestPermission();
    }

    // Update food history and suggestions when switching to food or suggestions tab
    document.getElementById('foodBtn').addEventListener('click', () => {
        foodTracker.updateWeeklyView();
    });

    document.getElementById('suggestionsBtn').addEventListener('click', () => {
        suggestionsManager.generateAllSuggestions();
    });

    // Update suggestions when profile is saved
    document.getElementById('saveProfile').addEventListener('click', () => {
        setTimeout(() => suggestionsManager.generateAllSuggestions(), 100);
    });
});
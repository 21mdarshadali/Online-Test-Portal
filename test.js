// Test Page Script - JSON se questions load karega
document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const testTitle = document.getElementById('test-title');
    const testDescription = document.getElementById('test-description');
    const studentName = document.getElementById('student-name');
    const studentCourse = document.getElementById('student-course');
    const questionText = document.getElementById('question-text');
    const questionContent = document.getElementById('question-content');
    const currentQ = document.getElementById('current-q');
    const totalQ = document.getElementById('total-q');
    const timerElement = document.getElementById('timer');
    const omrGrid = document.getElementById('omr-grid');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const submitBottomBtn = document.getElementById('submit-bottom-btn');

    // Test Variables
    let currentQuestionIndex = 0;
    let questions = [];
    let test = {};
    let userAnswers = [];
    let timeLeft = 0;
    let timerInterval;

    // Initialize Test
    initTest();

    async function initTest() {
        // Get user details
        const userDetails = JSON.parse(localStorage.getItem('testUserDetails'));
        if (!userDetails) {
            alert('Please register first!');
            window.location.href = 'index.html';
            return;
        }

        // Display user info
        studentName.textContent = userDetails.name;
        studentCourse.textContent = userDetails.course;

        // Load questions based on course from JSON
        await loadQuestionsFromJSON(userDetails.course);
    }

    async function loadQuestionsFromJSON(course) {
        try {
            // Fetch questions from JSON file
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error('Failed to load questions');
            }

            const data = await response.json();

            // Find test for selected course
            const courseTest = data.tests.find(t => t.course === course);

            if (!courseTest) {
                // Fallback to first test if course not found
                test = data.tests[0];
            } else {
                test = courseTest;
            }

            // RANDOMIZE QUESTIONS ORDER
            questions = [...test.questions];

            for (let i = questions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questions[i], questions[j]] = [questions[j], questions[i]];
            }

            timeLeft = test.duration * 60; // Convert to seconds

            // Initialize answers array
            userAnswers = new Array(questions.length).fill(null);

            // Display test info
            testTitle.textContent = test.title;
            testDescription.textContent = test.description;
            totalQ.textContent = questions.length;

            // Create OMR grid
            createOMRGrid();

            // Start timer
            startTimer();

            // Load first question
            loadQuestion(currentQuestionIndex);

        } catch (error) {
            console.error('Error loading questions:', error);
            // Fallback to hardcoded questions
            loadFallbackQuestions(course);
        }
    }

    function loadFallbackQuestions(course) {
        console.log('Using fallback questions for course:', course);

        // Fallback test data
        const fallbackTest = {
            id: 1,
            title: "History of Computers  ",
            description: "Basic history of computers test",
            duration: 10,
            course: "History_of_Computers_Basics",
            questions: [
                {
                    id: 1,
                    type: "mcq",
                    question: "What does HTML stand for?",
                    options: [
                        "Hyper Text Markup Language",
                        "High Tech Modern Language",
                        "Hyper Transfer Markup Language",
                        "Home Tool Markup Language"
                    ],
                    correctAnswer: "Hyper Text Markup Language",
                    points: 1
                },
                {
                    id: 2,
                    type: "mcq",
                    question: "Which CSS property is used to change text color?",
                    options: [
                        "text-color",
                        "font-color",
                        "color",
                        "text-style"
                    ],
                    correctAnswer: "color",
                    points: 1
                },
                {
                    id: 3,
                    type: "truefalse",
                    question: "JavaScript is a statically typed language.",
                    correctAnswer: false,
                    points: 1
                },
                {
                    id: 4,
                    type: "fillblank",
                    question: "The ______ property in CSS is used to create space between elements.",
                    correctAnswer: "margin",
                    points: 1
                },
                {
                    id: 5,
                    type: "mcq",
                    question: "Which of the following is NOT a JavaScript framework?",
                    options: [
                        "React",
                        "Angular",
                        "Vue",
                        "Django"
                    ],
                    correctAnswer: "Django",
                    points: 1
                }
            ]
        };

        test = fallbackTest;
        questions = test.questions;
        timeLeft = test.duration * 60;

        userAnswers = new Array(questions.length).fill(null);

        testTitle.textContent = test.title;
        testDescription.textContent = test.description;
        totalQ.textContent = questions.length;

        createOMRGrid();
        startTimer();
        loadQuestion(currentQuestionIndex);
    }

    function createOMRGrid() {
        omrGrid.innerHTML = '';
        for (let i = 0; i < questions.length; i++) {
            const omrNumber = document.createElement('div');
            omrNumber.className = 'omr-number';
            omrNumber.textContent = i + 1;
            omrNumber.dataset.index = i;

            omrNumber.addEventListener('click', function () {
                const index = parseInt(this.dataset.index);
                currentQuestionIndex = index;
                loadQuestion(index);
            });

            omrGrid.appendChild(omrNumber);
        }
        updateOMRGrid();
    }

    function updateOMRGrid() {
        const omrNumbers = document.querySelectorAll('.omr-number');
        omrNumbers.forEach((number, index) => {
            number.classList.remove('current', 'answered');

            if (index === currentQuestionIndex) {
                number.classList.add('current');
            }

            if (userAnswers[index] !== null) {
                number.classList.add('answered');
            }
        });
    }

    function loadQuestion(index) {
        currentQuestionIndex = index;
        const question = questions[index];

        // Update counters
        currentQ.textContent = index + 1;

        // Update question text
        questionText.textContent = question.question;

        // Clear previous content
        questionContent.innerHTML = '';

        // Load based on question type
        switch (question.type) {
            case 'mcq':
                loadMCQ(question);
                break;
            case 'truefalse':
                loadTrueFalse(question);
                break;
            case 'fillblank':
                loadFillBlank(question);
                break;
        }

        // Update OMR grid
        updateOMRGrid();

        // Update navigation buttons
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === questions.length - 1;
    }

    function loadMCQ(question) {
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';

        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';

            if (userAnswers[currentQuestionIndex] === option) {
                optionElement.classList.add('selected');
            }

            const optionLabel = document.createElement('div');
            optionLabel.className = 'option-label';
            optionLabel.textContent = String.fromCharCode(65 + index);

            const optionText = document.createElement('div');
            optionText.textContent = option;

            optionElement.appendChild(optionLabel);
            optionElement.appendChild(optionText);

            optionElement.addEventListener('click', function () {
                // Deselect all options
                document.querySelectorAll('.option').forEach(opt => {
                    opt.classList.remove('selected');
                });

                // Select this option
                this.classList.add('selected');

                // Save answer
                userAnswers[currentQuestionIndex] = option;

                // Update OMR grid
                updateOMRGrid();
            });

            optionsContainer.appendChild(optionElement);
        });

        questionContent.appendChild(optionsContainer);
    }

    function loadTrueFalse(question) {
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container truefalse-options';

        // True option
        const trueOption = document.createElement('div');
        trueOption.className = 'option';
        if (userAnswers[currentQuestionIndex] === true) {
            trueOption.classList.add('selected');
        }
        trueOption.innerHTML = '<div class="option-label">T</div><div>True</div>';

        trueOption.addEventListener('click', function () {
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            userAnswers[currentQuestionIndex] = true;
            updateOMRGrid();
        });

        // False option
        const falseOption = document.createElement('div');
        falseOption.className = 'option';
        if (userAnswers[currentQuestionIndex] === false) {
            falseOption.classList.add('selected');
        }
        falseOption.innerHTML = '<div class="option-label">F</div><div>False</div>';

        falseOption.addEventListener('click', function () {
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            userAnswers[currentQuestionIndex] = false;
            updateOMRGrid();
        });

        optionsContainer.appendChild(trueOption);
        optionsContainer.appendChild(falseOption);
        questionContent.appendChild(optionsContainer);
    }

    function loadFillBlank(question) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'fill-blank-input';
        input.placeholder = 'Type your answer here...';

        if (userAnswers[currentQuestionIndex]) {
            input.value = userAnswers[currentQuestionIndex];
        }

        input.addEventListener('input', function () {
            userAnswers[currentQuestionIndex] = this.value;
            if (this.value.trim() !== '') {
                updateOMRGrid();
            }
        });

        questionContent.appendChild(input);
    }

    function startTimer() {
        updateTimerDisplay();
        timerInterval = setInterval(function () {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                submitTest();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft <= 300) { // 5 minutes left
            timerElement.style.color = '#ff6b6b';
        }
    }

    // Navigation
    prevBtn.addEventListener('click', function () {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion(currentQuestionIndex);
        }
    });

    nextBtn.addEventListener('click', function () {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            loadQuestion(currentQuestionIndex);
        }
    });

    // Submit Test - UPDATED VERSION to save question details
    function submitTest() {

        // Clear timer
        clearInterval(timerInterval);

        // Calculate results
        let correct = 0;
        let wrong = 0;
        let unattempted = 0;

        // Create array to store question details
        const questionDetails = [];

        questions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            let isCorrect = false;
            let status = 'unattempted';

            if (userAnswer === null || userAnswer === '') {
                unattempted++;
                status = 'unattempted';
            } else {
                if (question.type === 'mcq') {
                    if (userAnswer === question.correctAnswer) {
                        correct++;
                        isCorrect = true;
                        status = 'correct';
                    } else {
                        wrong++;
                        status = 'wrong';
                    }
                } else if (question.type === 'truefalse') {
                    if (userAnswer === question.correctAnswer) {
                        correct++;
                        isCorrect = true;
                        status = 'correct';
                    } else {
                        wrong++;
                        status = 'wrong';
                    }
                } else if (question.type === 'fillblank') {
                    if (userAnswer.toString().toLowerCase().trim() === question.correctAnswer.toString().toLowerCase().trim()) {
                        correct++;
                        isCorrect = true;
                        status = 'correct';
                    } else {
                        wrong++;
                        status = 'wrong';
                    }
                }
            }

            // Store question details
            questionDetails.push({
                questionNumber: index + 1,
                question: question.question,
                type: question.type,
                userAnswer: userAnswer,
                correctAnswer: question.correctAnswer,
                options: question.options || [],
                isCorrect: isCorrect,
                status: status
            });
        });

        const total = questions.length;
        const score = Math.round((correct / total) * 100);

        // Get user details
        const userDetails = JSON.parse(localStorage.getItem('testUserDetails'));

        // Create result object WITH question details
        const result = {
  name: userDetails.name,
  email: userDetails.email,
  batch: userDetails.batch,
  course: userDetails.course,      // internal key
  subject: test.title,              // ✅ chapter / subject name
  date: new Date().toISOString(),
  score: score,
  correct: correct,
  wrong: wrong,
  unattempted: unattempted,
  total: total,
  questions: questionDetails,
  testTitle: test.title
};


        // Save to localStorage
        let results = JSON.parse(localStorage.getItem('testResults')) || [];
        results.push(result);
// 🔥 SAVE RESULT TO FIREBASE
window.db.collection("testResults").add({
    name: result.name,
    email: result.email,
    batch: result.batch,
    course: result.course,
    subject: result.subject,   // ✅ ADDED
    score: result.score,
    correct: result.correct,
    wrong: result.wrong,
    unattempted: result.unattempted,
    total: result.total,
    testTitle: result.testTitle,
    date: new Date(),
    questions: result.questions
})
.then(() => {
    console.log("✅ Firebase save SUCCESS");

    // Local backup
    localStorage.setItem('testResults', JSON.stringify(results));
    localStorage.removeItem('testUserDetails');

    alert(`Test Submitted Successfully!\n\nScore: ${score}%`);
    window.location.href = 'results.html';
})
.catch((error) => {
    console.error("❌ Firebase error:", error);
    alert("Firebase save failed. Check console.");
});

    }
    // Submit buttons event
    submitBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to submit the test?')) {
            submitTest();
        }
    });

    submitBottomBtn.addEventListener('click', function () {
        submitBtn.click();
    });
});
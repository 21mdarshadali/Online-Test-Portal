// Home Page Script
document.addEventListener('DOMContentLoaded', function () {
    const registrationForm = document.getElementById('registration-form');

    // 1. Form Submission
    registrationForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Get form values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const batch = document.getElementById('batch').value;
        const course = document.getElementById('course').value;
        const terms = document.getElementById('terms').checked;

        // Validation
        if (!name || !email || !batch || !course) {
            alert('Please fill all fields!');
            return;
        }

        if (!terms) {
            alert('Please agree to terms & conditions!');
            return;
        }

        // Save user details
        const userDetails = {
            name: name,
            email: email,
            batch: batch,
            course: course,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('testUserDetails', JSON.stringify(userDetails));

        // Redirect to test page
        window.location.href = 'test.html';
    });



    // 3. Close Modal
    closeModal.addEventListener('click', function () {
        resultsModal.style.display = 'none';
    });

    // 4. Close modal when clicking outside
    window.addEventListener('click', function (e) {
        if (e.target === resultsModal) {
            resultsModal.style.display = 'none';
        }
    });
});



const toggleBtn = document.getElementById("theme-toggle");

toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    // icon change
    toggleBtn.textContent = 
        document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
});

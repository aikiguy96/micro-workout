let workoutData;
let selectedPrescription;


// ==========================================
// Load exercise and prescription data
// ==========================================

async function loadWorkout() {

    try {

        const response =
            await fetch("exercises.json");

        if (!response.ok) {

            throw new Error(
                `Could not load exercises.json: ${response.status}`
            );
        }


        workoutData =
            await response.json();


        populatePrescriptionList();

    }
    catch (error) {

        console.error(
            "Error loading workout data:",
            error
        );


        document.getElementById(
            "exercise-list"
        ).innerHTML =
            "<p>Unable to load workout data.</p>";
    }
}


// ==========================================
// Populate prescription selector
// ==========================================

function populatePrescriptionList() {

    const select =
        document.getElementById(
            "prescription-select"
        );


    select.innerHTML = "";


    for (const prescription of
         workoutData.prescriptions) {

        const option =
            document.createElement("option");


        option.value =
            prescription.id;


        option.textContent =
            prescription.name;


        select.appendChild(option);
    }


    // --------------------------------------
    // Restore previously selected
    // prescription.
    // --------------------------------------

    const savedPrescription =
        localStorage.getItem(
            "selectedPrescription"
        );


    selectedPrescription =
        workoutData.prescriptions.find(
            prescription =>
                prescription.id ===
                savedPrescription
        );


    // If nothing has been saved yet,
    // use the first prescription.

    if (!selectedPrescription) {

        selectedPrescription =
            workoutData.prescriptions[0];
    }


    if (selectedPrescription) {

        select.value =
            selectedPrescription.id;


        createWorkout();
    }
}


// ==========================================
// Prescription changed
// ==========================================

function changePrescription() {

    const select =
        document.getElementById(
            "prescription-select"
        );


    selectedPrescription =
        workoutData.prescriptions.find(
            prescription =>
                prescription.id ===
                select.value
        );


    if (!selectedPrescription) {
        return;
    }


    // Remember the selected prescription.

    localStorage.setItem(
        "selectedPrescription",
        selectedPrescription.id
    );


    createWorkout();
}


// ==========================================
// Build workout interface
// ==========================================

function createWorkout() {

    const exerciseList =
        document.getElementById(
            "exercise-list"
        );


    exerciseList.innerHTML = "";


    // --------------------------------------
    // Prescription description
    // --------------------------------------

    const description =
        document.getElementById(
            "prescription-description"
        );


    description.textContent =
        selectedPrescription.description || "";


    // --------------------------------------
    // Load saved checkbox state
    // --------------------------------------

    const savedProgress =
        loadProgress();


    // --------------------------------------
    // Build each exercise row
    // --------------------------------------

    for (const item of
         selectedPrescription.exercises) {

        const exercise =
            workoutData.exercises.find(
                exercise =>
                    exercise.id ===
                    item.exerciseId
            );


        // Protect against an invalid
        // exercise reference in the JSON.

        if (!exercise) {

            console.warn(
                `Exercise not found: ${item.exerciseId}`
            );

            continue;
        }


        // ==================================
        // Exercise row
        // ==================================

        const card =
            document.createElement("div");


        card.className =
            "exercise-card";


        // ==================================
        // Exercise information
        // ==================================

        const exerciseInfo =
            document.createElement("div");


        exerciseInfo.className =
            "exercise-info";


        // Exercise name

        const title =
            document.createElement("h2");


        title.textContent =
            exercise.name;


        // Exercise target

        const exerciseDescription =
            document.createElement("p");


        exerciseDescription.className =
            "exercise-description";


        exerciseDescription.textContent =
            formatTarget(
                item.target,
                exercise.measurement
            );


        exerciseInfo.appendChild(
            title
        );


        exerciseInfo.appendChild(
            exerciseDescription
        );


        // ==================================
        // Checkbox container
        // ==================================

        const checkboxContainer =
            document.createElement("div");


        checkboxContainer.className =
            "checkbox-container";


        // ----------------------------------
        // One checkbox per prescribed set
        // ----------------------------------

        for (
            let set = 0;
            set < item.sets;
            set++
        ) {

            const checkbox =
                document.createElement("input");


            checkbox.type =
                "checkbox";


            checkbox.className =
                "set-checkbox";


            checkbox.dataset.exercise =
                exercise.id;


            checkbox.dataset.set =
                set;


            // Restore previous checkbox state.

            if (
                savedProgress[exercise.id] &&
                savedProgress[exercise.id][set]
            ) {

                checkbox.checked =
                    true;
            }


            // Save state whenever a checkbox
            // changes.

            checkbox.addEventListener(
                "change",
                () => {

                    saveProgress();

                    updateProgress();
                }
            );


            checkboxContainer.appendChild(
                checkbox
            );
        }


        // ==================================
        // Assemble row
        // ==================================

        card.appendChild(
            exerciseInfo
        );


        card.appendChild(
            checkboxContainer
        );


        exerciseList.appendChild(
            card
        );
    }


    updateProgress();
}


// ==========================================
// Format exercise target
// ==========================================

function formatTarget(
    target,
    measurement
) {

    switch (measurement) {

        case "reps":

            return `${target} reps`;


        case "seconds":

            return `${target} sec`;


        case "reps_per_side":

            return `${target} reps / side`;


        case "seconds_per_side":

            return `${target} sec / side`;


        default:

            return `${target} ${measurement}`;
    }
}


// ==========================================
// Save current checkbox state
// ==========================================

function saveProgress() {

    if (!selectedPrescription) {
        return;
    }


    const progress = {};


    const checkboxes =
        document.querySelectorAll(
            ".set-checkbox"
        );


    for (const checkbox of checkboxes) {

        const exerciseId =
            checkbox.dataset.exercise;


        const setNumber =
            Number(
                checkbox.dataset.set
            );


        if (!progress[exerciseId]) {

            progress[exerciseId] = [];
        }


        progress[exerciseId][setNumber] =
            checkbox.checked;
    }


    // Each prescription gets its own
    // persistent checkbox state.

    const storageKey =
        `progress_${selectedPrescription.id}`;


    localStorage.setItem(
        storageKey,
        JSON.stringify(progress)
    );
}


// ==========================================
// Load current checkbox state
// ==========================================

function loadProgress() {

    if (!selectedPrescription) {

        return {};
    }


    const storageKey =
        `progress_${selectedPrescription.id}`;


    const saved =
        localStorage.getItem(
            storageKey
        );


    if (!saved) {

        return {};
    }


    try {

        return JSON.parse(saved);

    }
    catch (error) {

        console.error(
            "Unable to read saved checkbox state:",
            error
        );


        return {};
    }
}


// ==========================================
// Update progress indicator
// ==========================================

function updateProgress() {

    const checkboxes =
        document.querySelectorAll(
            ".set-checkbox"
        );


    const completed =
        document.querySelectorAll(
            ".set-checkbox:checked"
        );


    const total =
        checkboxes.length;


    const done =
        completed.length;


    const percent =
        total === 0
            ? 0
            : (done / total) * 100;


    document.getElementById(
        "progress-text"
    ).textContent =
        `${done} / ${total}`;


    document.getElementById(
        "progress-bar"
    ).style.width =
        `${percent}%`;
}


// ==========================================
// Reset current prescription
// ==========================================

function resetWorkout() {

    const checkboxes =
        document.querySelectorAll(
            ".set-checkbox"
        );


    for (const checkbox of checkboxes) {

        checkbox.checked =
            false;
    }


    saveProgress();

    updateProgress();
}


// ==========================================
// Event listeners
// ==========================================

document.getElementById(
    "prescription-select"
).addEventListener(
    "change",
    changePrescription
);


document.getElementById(
    "reset-button"
).addEventListener(
    "click",
    resetWorkout
);


// ==========================================
// Start application
// ==========================================

loadWorkout();

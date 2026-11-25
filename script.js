const slides = [
    {
        image: "IMG 1.jpeg",
        caption: "Meu lugar favorito, com a minha pessoa favorita."
    },
    {
        image: "img 2.jpg",
        caption: "Cada instante ao seu lado vira a minha melhor lembrança."
    },
    {
        image: "img 3.jpeg",
        caption: "Nosso pequeno infinito construído dia após dia."
    }
];

let currentIndex = 0;
let autoPlayInterval;
const AUTO_PLAY_DELAY = 4000;
const PERSON_AUTO_PLAY_DELAY = 2000;
const personSlides = {
    him: Array.from({ length: 7 }, (_, index) => `imagem dele ${index + 1}.jpeg`),
    her: Array.from({ length: 8 }, (_, index) => `imagem dela ${index + 2}.jpeg`)
};
const personCarousels = {};
let personAutoPlayInterval;

const polaroidStage = document.querySelector(".polaroid-stage");
const polaroidCard = document.getElementById("active-polaroid");
const carouselImg = document.getElementById("carousel-img");
const carouselCaption = document.getElementById("carousel-caption");
const prevPreview = document.getElementById("prev-preview");
const nextPreview = document.getElementById("next-preview");
const counter = document.getElementById("carousel-counter");

function updateCarousel(index) {
    polaroidCard.classList.add("fade-out");

    setTimeout(() => {
        currentIndex = (index + slides.length) % slides.length;
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        const nextIndex = (currentIndex + 1) % slides.length;

        carouselImg.src = slides[currentIndex].image;
        carouselCaption.textContent = slides[currentIndex].caption;
        prevPreview.src = slides[prevIndex].image;
        nextPreview.src = slides[nextIndex].image;

        const formattedCurrent = String(currentIndex + 1).padStart(2, "0");
        const formattedTotal = String(slides.length).padStart(2, "0");
        counter.textContent = `${formattedCurrent} / ${formattedTotal}`;

        polaroidCard.classList.remove("fade-out");
    }, 180);
}

function startAutoPlay() {
    stopAutoPlay();
    autoPlayInterval = setInterval(() => {
        updateCarousel(currentIndex + 1);
    }, AUTO_PLAY_DELAY);
}

function stopAutoPlay() {
    clearInterval(autoPlayInterval);
}

function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
}

polaroidCard.addEventListener("click", () => {
    updateCarousel(currentIndex + 1);
    resetAutoPlay();
});
polaroidCard.style.cursor = "pointer";
polaroidCard.setAttribute("role", "button");
polaroidCard.setAttribute("aria-label", "Próxima foto");

polaroidStage.addEventListener("mouseenter", stopAutoPlay);
polaroidStage.addEventListener("mouseleave", startAutoPlay);

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
        updateCarousel(currentIndex - 1);
        resetAutoPlay();
    }
    if (event.key === "ArrowRight") {
        updateCarousel(currentIndex + 1);
        resetAutoPlay();
    }
});

startAutoPlay();

const usScreen = document.getElementById("us-screen");
const usChoice = document.getElementById("us-choice");
const himPanel = document.getElementById("him-panel");
const herPanel = document.getElementById("her-panel");
const openUsScreen = document.getElementById("open-us-screen");
const closeUsScreen = document.getElementById("close-us-screen");

function showPerson(person) {
    clearInterval(personAutoPlayInterval);
    usChoice.hidden = true;
    himPanel.hidden = person !== "him";
    herPanel.hidden = person !== "her";
    personAutoPlayInterval = setInterval(personCarousels[person], PERSON_AUTO_PLAY_DELAY);
}

openUsScreen.addEventListener("click", () => {
    usScreen.hidden = false;
    document.body.classList.add("us-screen-open");
    clearInterval(personAutoPlayInterval);
    usChoice.hidden = false;
    himPanel.hidden = true;
    herPanel.hidden = true;
});

closeUsScreen.addEventListener("click", () => {
    clearInterval(personAutoPlayInterval);
    usScreen.hidden = true;
    document.body.classList.remove("us-screen-open");
});

document.querySelectorAll("[data-close-us-screen]").forEach((button) => {
    button.addEventListener("click", () => closeUsScreen.click());
});

document.querySelectorAll("[data-show-person]").forEach((button) => {
    button.addEventListener("click", () => showPerson(button.dataset.showPerson));
});

usScreen.addEventListener("click", (event) => {
    if (event.target === usScreen) {
        closeUsScreen.click();
    }
});

document.querySelectorAll("[data-person-carousel]").forEach((carousel) => {
    const photoButton = carousel.querySelector(".person-photo");
    const image = photoButton.querySelector("img");
    const dotsElement = carousel.querySelector(".person-dots");
    const images = personSlides[carousel.dataset.personCarousel];
    let index = 0;

    images.forEach((_, dotIndex) => {
        const dot = document.createElement("span");
        dot.classList.toggle("active", dotIndex === 0);
        dotsElement.append(dot);
    });

    function advancePhoto() {
        index = (index + 1) % images.length;
        image.src = images[index];
        dotsElement.querySelectorAll("span").forEach((dot, dotIndex) => {
            dot.classList.toggle("active", dotIndex === index);
        });
    }

    personCarousels[carousel.dataset.personCarousel] = advancePhoto;
    photoButton.addEventListener("click", advancePhoto);

});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !usScreen.hidden) {
        closeUsScreen.click();
    }
});

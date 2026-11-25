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

const polaroidStage = document.querySelector(".polaroid-stage");
const polaroidCard = document.getElementById("active-polaroid");
const carouselImg = document.getElementById("carousel-img");
const carouselCaption = document.getElementById("carousel-caption");
const prevPreview = document.getElementById("prev-preview");
const nextPreview = document.getElementById("next-preview");
const counter = document.getElementById("carousel-counter");
const dots = document.querySelectorAll(".dot");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

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

        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === currentIndex);
        });

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
    updateCarousel(0);
    startAutoPlay();
}

prevBtn.addEventListener("click", () => {
    updateCarousel(currentIndex - 1);
    resetAutoPlay();
});

nextBtn.addEventListener("click", () => {
    updateCarousel(currentIndex + 1);
    resetAutoPlay();
});

dots.forEach((dot) => {
    dot.addEventListener("click", () => {
        const index = Number(dot.getAttribute("data-index"));
        updateCarousel(index);
        resetAutoPlay();
    });
});

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

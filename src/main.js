import Track from "./scenes/Track";

const pause = document.getElementById("pause");
const title = document.getElementById("title");
const result = document.getElementById("result");
const length = document.getElementById("length");
const button = document.getElementById("play");

const track = new Track((distance, end = false) =>
{
    length.textContent = `${Math.max(distance / 1e3, 0).toFixed(3)}km`;
    title.textContent = end ? "Play Again" : "Continue";
    result.classList.remove("hidden");
    pause.classList.toggle("hidden");
});

button.addEventListener("click", () =>
{
    const start = title.textContent === "Start Game";
    const restart = title.textContent === "Play Again";

    pause.classList.toggle("hidden");
    track.start(start, restart);
});

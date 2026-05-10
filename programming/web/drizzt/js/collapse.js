export function collapse(){
    document.querySelectorAll(".collapse").forEach(button => {
        const target = document.getElementById(button.dataset.target);

        if(!target) return;

        target.hidden = true;

        button.addEventListener("click", () => {
            target.hidden = !target.hidden;
        });
    });
}
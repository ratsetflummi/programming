

async function getHolidays() {
    return {"feiertage":[
        {"date": "2026-01-01"},
        {"date": "2026-01-06"},
        {"date": "2026-04-03"},
        {"date": "2026-05-01"},
        {"date": "2026-05-14"},
        {"date": "2026-05-25"},
        {"date": "2026-06-04"},
        {"date": "2026-08-15"},
        {"date": "2026-10-03"},
        {"date": "2026-11-01"},
        {"date": "2026-12-25"},
        {"date": "2026-12-26"},
        {"date": "2027-01-01"},
        {"date": "2027-01-06"},
    ]};
    //return await fetch("https://get.api-feiertage.de?states=by").then(res => res.json());
}

const uniTimes = [
    {"start": "2026-03-15", "end": "2026-04-01"},
    {"start": "2026-04-09", "end": "2026-04-30"},
    {"start": "2026-05-02", "end": "2026-05-13"},
    {"start": "2026-05-16", "end": "2026-05-24"},
    {"start": "2026-05-27", "end": "2026-06-03"},
    {"start": "2026-06-06", "end": "2026-07-31"},
    {"start": "2026-10-01", "end": "2026-10-30"},
    {"start": "2026-11-02", "end": "2026-12-20"},
    {"start": "2027-01-11", "end": "2027-02-28"},
]

async function main() {

    let holidays = await getHolidays();
    holidays = holidays["feiertage"];

    let today = new Date();

    const yearInput = document.getElementById("year-input");
    yearInput.addEventListener("change",()=>{buildCalendar(yearInput.value)})
    yearInput.value = today.getFullYear();
    buildCalendar(yearInput.value);
    addHolidays(holidays);

    addUnavailableTimesInput();
    drawUnavailableTimes();
    markDay(today);
    document.getElementById("add-unavailable-time").addEventListener("click",addUnavailableTimesInput);

}

function markDay(date){
    console.log(getDateString(date));
    const cell = document.getElementById(getDateString(date));
    if (cell){
        cell.classList.add("marked-day");
    }
}

function getUnavailableTimes(){
    const times = uniTimes;
    const table = document.getElementById("unavailable-times");
    const rows = Array.from(table.querySelectorAll("tr"));
    rows.forEach(row=>{
        const startInput = row.querySelector(".start");
        const endInput = row.querySelector(".end");
        if(startInput.value && endInput.value){
            times.push({"start":startInput.value, "end":endInput.value})
        }
    })
    return times;
}

function drawUnavailableTimes(){
    document.querySelectorAll("td").forEach(td=>{td.style.backgroundColor = ""});
    const unavailableTimes = getUnavailableTimes();
    unavailableTimes.forEach(time=>{
        if(time["start"] > time["end"]){
            return;
        }
        let date = new Date(time["start"]);
        let endDate = new Date(time["end"]);
        
        while (date <= endDate){
            const cell = document.getElementById(getDateString(date));
            if(cell){
                cell.style.backgroundColor = "red";
            }
            incrementDate(date);
        }
    })
}

function incrementDate(date){
    date.setDate(date.getDate() + 1);
}

function addUnavailableTimesInput(){
    const unavailableTimesTable = document.getElementById("unavailable-times");

    const startInput = document.createElement("input");
    startInput.classList.add("start");
    const endInput = document.createElement("input");
    endInput.classList.add("end");
    [startInput,endInput].forEach(input=>{
        input.type = "date";
        input.addEventListener("change",drawUnavailableTimes);
    })
    const startLabel = document.createElement("span");
    const endLabel = document.createElement("span");
    startLabel.innerText = "Start:";
    endLabel.innerText = "End:";
    const row = document.createElement("tr");
    const removeButton = document.createElement("button");
    removeButton.innerText = "-";
    removeButton.addEventListener("click",()=>{row.remove()});
    unavailableTimesTable.appendChild(row);
    [startLabel,startInput,endLabel,endInput,removeButton].forEach(content=>{
        const cell = document.createElement("td");
        row.appendChild(cell);
        cell.appendChild(content);
    })

}

function getDateString(date){
    return date.getFullYear() + "-" + fillLeadingZeroes(date.getMonth() + 1) + "-" + fillLeadingZeroes(date.getDate());
}

function fillLeadingZeroes(number){
    if (number < 10){
        return "0" + number;
    }
    return number;
}

function buildCalendar(year){
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";
    let date = new Date(year,0,1);
    let endDate = new Date(parseInt(year)+1, 0, 15);

    let i = 0;
    let cell;
    let weekday = date.getDay();
    if (weekday == 0) weekday = 7;
    weekday = weekday - 1;
    let row = document.createElement("tr");
    calendar.appendChild(row);
    for (let i = 0; i < weekday; i++){
        cell = document.createElement("td");
        row.appendChild(cell);
    }
    while (date <= endDate){
        if(date.getDay() == 1){
            row = document.createElement("tr");
            calendar.appendChild(row);
        }
        cell = document.createElement("td");
        row.appendChild(cell);
        cell.innerText = date.toLocaleDateString("de-DE",
            {
            weekday: "short",
            month: "long",
            day: "numeric"});
        if(date.getDay() == 6 || date.getDay() == 0){
            cell.classList.add("weekend");
        }
        
        cell.id = getDateString(date);
        cell.style.height = "30px";

        date.setDate(date.getDate() + 1);
    }

}

function addHolidays(holidays){
    holidays.forEach(holiday=>{
        try{
            let cell = document.getElementById(holiday.date);
            cell.classList.add("holiday");
        } catch {

        }
    })
}

main();
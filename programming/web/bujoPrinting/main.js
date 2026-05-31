const page = document.querySelector("body");

function drawControllElements(){
    page.innerHTML = "";
    const controllSection = document.createElement("div");
    page.appendChild(controllSection);
    ["left","right"].forEach(side=>{
        const dateSelector = document.createElement("input");
        dateSelector.type = "date";
        controllSection.appendChild(dateSelector);
        dateSelector.value = new Date().toISOString().substring(0,10);

        const printCalendarButton = document.createElement("button");
        controllSection.appendChild(printCalendarButton);
        printCalendarButton.innerText = "print calendar";
        printCalendarButton.addEventListener("click",()=>{
            printCalendar(new Date(dateSelector.value));
        })

        const printWeekButton = document.createElement("button");
        controllSection.appendChild(printWeekButton);
        printWeekButton.innerText = "print week";
        printWeekButton.addEventListener("click",()=>{
            printWeek(new Date(dateSelector.value));
        })
        
        const printMonthTitleButton = document.createElement("button");
        controllSection.appendChild(printMonthTitleButton);
        printMonthTitleButton.innerText = "print month title";
        printMonthTitleButton.addEventListener("click",()=>{
            printMonthTitle(new Date(dateSelector.value));
        })
        
    })

    const printButton = document.createElement("button");
    controllSection.appendChild(printButton);
    printButton.innerText = "print";
    printButton.addEventListener("click",()=>{
        controllSection.remove();
        print();
    })
}

function printCalendar(startDate){
    const calendarStart = getCalendarStart(startDate);
    const dayCounter = new Date(calendarStart);
    const calendar = document.createElement("table");
    const calendarTitle = document.createElement("h2");
    calendarTitle.innerText = getMonthName(startDate);
    calendarTitle.classList.add("calendar-title");
    page.appendChild(calendarTitle);
    calendar.classList.add("calendar");
    page.appendChild(calendar);
    do {
        const row = document.createElement("tr");
        calendar.appendChild(row);
        for(let i = 0; i < 7; i++){
            const cell = document.createElement("td");
            row.appendChild(cell);
            cell.innerText = formatDay(dayCounter);
            if(dayCounter.getMonth() == startDate.getMonth()){
                cell.classList.add("in-month");
            } else {
                cell.classList.add("out-of-month");
            }
            addDaysToDate(dayCounter,1);
        }
    }
    while (dayIsInStartMonth(dayCounter,startDate)); 
}

function printMonthTitle(startDate){
    const monthTitle = getMonthName(startDate);
    const monthTitleDiv = document.createElement("h1");
    monthTitleDiv.innerText = monthTitle;
    page.appendChild(monthTitleDiv);
    monthTitleDiv.classList.add("month-title");

}

function printWeek(startDate) {
    page.innerHTML = "";
    const weekStart = getStartOfWeek(new Date(startDate));

    const container = document.createElement("div");
    container.className = "week-container";

    const table = document.createElement("table");
    table.className = "week-view";

    const days = [];
    const d = new Date(weekStart);

    for (let i = 0; i < 7; i++) {
        days.push(formatFullDay(d));
        addDaysToDate(d, 1);
    }

    const cells = [
        "This Week",
        days[0],
        days[1],
        days[2],
        days[3],
        days[4],
        days[5],
        days[6],
        "Next Week"
    ];

    let index = 0;

    for (let r = 0; r < 3; r++) {
        const tr = document.createElement("tr");

        for (let c = 0; c < 3; c++) {
            const td = document.createElement("td");
            td.textContent = cells[index++] || "";
            tr.appendChild(td);
        }

        table.appendChild(tr);
    }

    container.appendChild(table);
    document.body.appendChild(container);

    print();

}

function addDays(date, days) {
    date.setDate(date.getDate() + days);
    return date;
}

function formatWeekday(date) {
    return date.toLocaleDateString("en-GB", {
        weekday: "long"
    });
}

function getStartOfWeek(date){
    const bufferDate = new Date(date);
    const difference = bufferDate.getDay() -1;
    if(bufferDate.getDay() == 0){
        addDaysToDate(bufferDate,-6);
        return bufferDate;
    }
    addDaysToDate(bufferDate,-1*difference);
    return bufferDate;
}

function getStartOfMonth(date){
    const bufferDate = new Date(date);
    const difference = bufferDate.getDate() - 1;
    addDaysToDate(bufferDate,-1*difference);
    return bufferDate;
}

function getCalendarStart(date){
    return getStartOfWeek(getStartOfMonth(date));
}

function addDaysToDate(date,days){
    date.setDate(date.getDate() + days);
}

function dayIsInStartMonth(day,startDate){
    return day.getMonth() == startDate.getMonth();
}

function formatDay(date){
    weekdayOption =  {
        "weekday": "short"
    }
    dayOption = {
        "day": "2-digit"
    }
    const dayString = date.toLocaleDateString("de-DE",dayOption);
    return dayString;
}

function formatFullDay(date){
    fullDayOption = {
        "weekday": "short",
        "day": "2-digit",
        "month": "2-digit",
        "year": "2-digit",
    }
    const dayString = date.toLocaleDateString("de-DE",fullDayOption).replace(".,",",");
    return dayString;
}

function getMonthName(date){
    return date.toLocaleDateString("de-DE",{"month":"long"});
}

drawControllElements();
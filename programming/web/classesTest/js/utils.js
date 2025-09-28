getNavigation();
function getNavigation(){
    fetch('./nav-bar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('nav-bar').innerHTML = data;
    });
}

export class Cookies {
    constructor(){
        this.cookies = document.cookie;
        this.setCookie = function(name,value,days){
            const d = new Date();
            d.setTime(d.getTime() + (days*24*60*60*1000));
            let expires = "expires="+ d.toUTCString();
            document.cookie = name + "=" + value + ";" + expires + ";path=/";
        };
        this.getCookie = function(name){
            name = name + "=";
            let decodedCookie = decodeURIComponent(document.cookie);
            let ca = decodedCookie.split(';');
            for(let i = 0; i <ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') {
                c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
                }
            }
            return "";
        };
    }
}

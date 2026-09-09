// =======================================================
// CONFIGURATION
// =======================================================

const LATITUDE = 35.263186434197564;
const LONGITUDE = -97.46300980772602;

const LOCATION_NAME = "LOCAL";

const WEATHER_REFRESH_INTERVAL =
    15 * 60 * 1000;


let weatherData = null;



// =======================================================
// DATE + TIME
// =======================================================

function updateClock() {

    const now = new Date();


    const day = now.toLocaleDateString(
        undefined,
        {
            weekday: "long"
        }
    );


    const date = now.toLocaleDateString(
        undefined,
        {
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );


    const time = now.toLocaleTimeString(
        undefined,
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );


    const statusTime = now.toLocaleTimeString(
        undefined,
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );


    document.getElementById("day").textContent =
        day.toUpperCase();


    document.getElementById("date").textContent =
        date;


    document.getElementById("status-clock").textContent =
        statusTime;


    document.getElementById("clock").textContent =
        time;

}


updateClock();

setInterval(updateClock, 1000);


// =======================================================
// SUN + MOON TRACKER
// =======================================================

function formatMinuteKey(totalMinutes) {

    const hours =
        Math.floor(totalMinutes / 60);


    const minutes =
        totalMinutes % 60;


    return (
        String(hours).padStart(2, "0") +
        String(minutes).padStart(2, "0")
    );

}


function getCelestialState(totalMinutes) {

    const sunrise =
        6 * 60;


    const noon =
        12 * 60;


    const sunset =
        18 * 60;


    if (
        totalMinutes >= sunrise &&
        totalMinutes < noon
    ) {

        return {
            iconName: "sun",
            motion: "rising"
        };

    }


    if (
        totalMinutes >= noon &&
        totalMinutes < sunset
    ) {

        return {
            iconName: "sun",
            motion: "setting"
        };

    }


    if (totalMinutes >= sunset) {

        return {
            iconName: "moon",
            motion: "rising"
        };

    }


    return {
        iconName: "moon",
        motion: "setting"
    };

}


function moonPhaseToName(phase) {

    if (typeof phase !== "number") {
        return "loading";
    }


    if (phase < 0.03 || phase >= 0.97) {
        return "new-moon";
    }


    if (phase < 0.22) {
        return "waxing-crescent";
    }


    if (phase < 0.28) {
        return "first-quarter";
    }


    if (phase < 0.47) {
        return "waxing-gibbous";
    }


    if (phase < 0.53) {
        return "full-moon";
    }


    if (phase < 0.72) {
        return "waning-gibbous";
    }


    if (phase < 0.78) {
        return "last-quarter";
    }


    return "waning-crescent";

}


function moonPhaseToLabel(phaseName) {

    return phaseName
        .split("-")
        .map(
            word =>
                word.toUpperCase()
        )
        .join(" ");

}


function updateCelestialIcon() {

    const now =
        new Date();


    const totalMinutes =
        (now.getHours() * 60) +
        now.getMinutes();


    const slotStart =
        totalMinutes -
        (totalMinutes % 15);


    const {
        iconName,
        motion
    } =
        getCelestialState(slotStart);


    const moonPhaseName =
        moonPhaseToName(
            weatherData?.daily?.moon_phase?.[0]
        );


    const moonPhaseLabel =
        moonPhaseToLabel(
            moonPhaseName
        );


    const iconKey =
        iconName === "moon"
            ? `${iconName}-${moonPhaseName}-${motion}`
            : `${iconName}-${motion}`;


    const label =
        `MOON PHASE: ${moonPhaseLabel}`;


    const icon =
        document.getElementById(
            "celestial-icon"
        );


    icon.className =
        `celestial-icon celestial-icon--${iconName}`;


    icon.innerHTML = "";


    document.getElementById(
        "celestial-icon-label"
    ).textContent =
        "icon incoming for " +
        `${iconKey}-` +
        formatMinuteKey(slotStart);


    icon.setAttribute(
        "aria-label",
        label
    );


    icon.setAttribute(
        "title",
        label
    );


    document.getElementById(
        "celestial-label"
    ).textContent =
        label;

}


function scheduleNextCelestialIconUpdate() {

    const now =
        new Date();


    const nextUpdate =
        new Date(now);


    const nextMinutes =
        Math.floor(now.getMinutes() / 15) *
        15 +
        15;


    nextUpdate.setMinutes(
        nextMinutes,
        0,
        0
    );


    setTimeout(
        function () {

            updateCelestialIcon();

            scheduleNextCelestialIconUpdate();

        },

        nextUpdate.getTime() -
        now.getTime()
    );

}


updateCelestialIcon();

scheduleNextCelestialIconUpdate();


// =======================================================
// BATTERY
// =======================================================

function renderBatteryStatus(battery) {

    const batteryFill =
        document.getElementById(
            "battery-fill"
        );


    const batteryStatus =
        document.getElementById(
            "battery-status"
        );


    if (!batteryFill || !batteryStatus) {
        return;
    }


    const level =
        Math.round(
            battery.level * 100
        );


    batteryFill.style.width =
        `${level}%`;


    batteryStatus.textContent =
        `BATTERY: ${level}%` +
        (battery.charging ? " // CHARGING" : "");

}


async function loadBatteryStatus() {

    const batteryFill =
        document.getElementById(
            "battery-fill"
        );


    const batteryStatus =
        document.getElementById(
            "battery-status"
        );


    if (!batteryFill || !batteryStatus) {
        return;
    }


    if (!navigator.getBattery) {

        batteryFill.style.width = "0%";

        batteryStatus.textContent =
            "BATTERY API UNAVAILABLE";

        return;

    }


    try {

        const battery =
            await navigator.getBattery();


        renderBatteryStatus(battery);


        battery.addEventListener(
            "levelchange",
            function () {
                renderBatteryStatus(battery);
            }
        );


        battery.addEventListener(
            "chargingchange",
            function () {
                renderBatteryStatus(battery);
            }
        );

    }

    catch (error) {

        console.error(error);

        batteryFill.style.width = "0%";

        batteryStatus.textContent =
            "BATTERY API UNAVAILABLE";

    }

}



// =======================================================
// WEATHER CODE TRANSLATION
// =======================================================

function weatherCodeToText(code) {

    const codes = {

        0: "CLEAR",

        1: "MAINLY CLEAR",

        2: "PARTLY CLOUDY",

        3: "OVERCAST",

        45: "FOG",

        48: "RIME FOG",

        51: "LIGHT DRIZZLE",

        53: "DRIZZLE",

        55: "HEAVY DRIZZLE",

        61: "LIGHT RAIN",

        63: "RAIN",

        65: "HEAVY RAIN",

        71: "LIGHT SNOW",

        73: "SNOW",

        75: "HEAVY SNOW",

        77: "SNOW GRAINS",

        80: "RAIN SHOWERS",

        81: "RAIN SHOWERS",

        82: "HEAVY SHOWERS",

        85: "SNOW SHOWERS",

        86: "HEAVY SNOW SHOWERS",

        95: "THUNDERSTORM",

        96: "THUNDERSTORM + HAIL",

        99: "SEVERE THUNDERSTORM"

    };


    return codes[code] ?? "UNKNOWN";

}


function weatherCodeToIconName(code) {

    if (code === 0 || code === 1) {
        return "sun";
    }


    if (code === 2 || code === 3) {
        return "cloud";
    }


    if (code === 45 || code === 48) {
        return "fog";
    }


    if (
        code === 51 ||
        code === 53 ||
        code === 55
    ) {
        return "drizzle";
    }


    if (
        code === 61 ||
        code === 63 ||
        code === 65 ||
        code === 80 ||
        code === 81 ||
        code === 82
    ) {
        return "rain";
    }


    if (
        code === 71 ||
        code === 73 ||
        code === 75 ||
        code === 77 ||
        code === 85 ||
        code === 86
    ) {
        return "snow";
    }


    if (code === 96 || code === 99) {
        return "hail";
    }


    if (code === 95) {
        return "storm";
    }


    return "unknown";

}


function renderWeatherIcon(code, sizeClass = "") {

    const condition =
        weatherCodeToText(code);


    const iconName =
        weatherCodeToIconName(code);


    return `
        <span class="forecast-icon-stack">
            <span class="icon-label">
                icon incoming for ${iconName}
            </span>

            <span
                class="pixel-weather-icon pixel-weather-icon--${iconName} ${sizeClass}"
                role="img"
                aria-label="${condition}"
                title="${condition}"
            ></span>
        </span>
    `;

}



// =======================================================
// WEATHER
// =======================================================


async function loadWeather() {

    if (
        LATITUDE === null ||
        LONGITUDE === null
    ) {

        document.getElementById(
            "weather-description"
        ).textContent =
            "SET LOCATION IN script.js";

        return;

    }


    try {

        const response =
            await fetch("/api/weather");


        if (!response.ok) {

            throw new Error(
                `Weather error: ${response.status}`
            );

        }


        weatherData =
            await response.json();


        renderTodayWeather();

        renderWeekWeather();

        updateCelestialIcon();

    }

    catch (error) {

        console.error(error);


        document.getElementById(
            "weather-description"
        ).textContent =
            "WEATHER CONNECTION ERROR";

    }

}



// =======================================================
// TODAY WEATHER
// =======================================================

function renderTodayWeather() {

    if (!weatherData) {
        return;
    }


    const current =
        weatherData.current;


    const daily =
        weatherData.daily;


    const weatherIcon =
        document.getElementById(
            "weather-icon"
        );


    const currentCondition =
        weatherCodeToText(
            current.weather_code
        );


    const currentIconName =
        weatherCodeToIconName(
            current.weather_code
        );


    weatherIcon.className =
        "pixel-weather-icon pixel-weather-icon--large " +
        `pixel-weather-icon--${currentIconName}`;


    weatherIcon.innerHTML = "";


    document.getElementById(
        "weather-icon-label"
    ).textContent =
        "icon incoming for " +
        currentIconName;


    weatherIcon.setAttribute(
        "aria-label",
        currentCondition
    );


    weatherIcon.setAttribute(
        "title",
        currentCondition
    );


    document.getElementById(
        "weather-location"
    ).textContent =
        LOCATION_NAME.toUpperCase();


    document.getElementById(
        "weather-temp"
    ).textContent =
        `${Math.round(current.temperature_2m)}°F`;


    document.getElementById(
        "weather-description"
    ).textContent =
        currentCondition;


    document.getElementById(
        "weather-feels"
    ).textContent =
        `${Math.round(
            current.apparent_temperature
        )}°F`;


    document.getElementById(
        "weather-wind"
    ).textContent =
        `${Math.round(
            current.wind_speed_10m
        )} mph`;


    document.getElementById(
        "weather-high"
    ).textContent =
        `${Math.round(
            daily.temperature_2m_max[0]
        )}°F`;


    document.getElementById(
        "weather-low"
    ).textContent =
        `${Math.round(
            daily.temperature_2m_min[0]
        )}°F`;


    document.getElementById(
        "weather-rain"
    ).textContent =
        `${daily.precipitation_probability_max[0]}%`;

}



// =======================================================
// WEEK WEATHER
// =======================================================

function renderWeekWeather() {

    if (!weatherData) {
        return;
    }


    const daily =
        weatherData.daily;


    const container =
        document.getElementById(
            "week-forecast"
        );


    container.innerHTML = "";


    for (
        let i = 0;
        i < daily.time.length;
        i++
    ) {

        /*
         * Add T12:00 so the browser doesn't
         * accidentally shift the calendar day
         * due to timezone parsing.
         */

        const date =
            new Date(
                daily.time[i] + "T12:00:00"
            );


        const dayName =
            date.toLocaleDateString(
                undefined,
                {
                    weekday: "short"
                }
            ).toUpperCase();


        const condition =
            weatherCodeToText(
                daily.weather_code[i]
            );


        const high =
            Math.round(
                daily.temperature_2m_max[i]
            );


        const low =
            Math.round(
                daily.temperature_2m_min[i]
            );


        const rain =
            daily.precipitation_probability_max[i];


        const row =
            document.createElement("div");


        row.className =
            "forecast-day";


        row.innerHTML = `
            <span class="forecast-name">
                ${dayName}
            </span>

            <span class="forecast-condition">
                ${renderWeatherIcon(
                    daily.weather_code[i],
                    "pixel-weather-icon--small"
                )}

                <span>
                    ${condition}
                </span>

                <span class="forecast-rain">
                    ${rain}%
                </span>
            </span>

            <span class="forecast-temp">
                ${high}° / ${low}°
            </span>
        `;


        container.appendChild(row);

    }

}



// =======================================================
// WEATHER TOGGLE
// =======================================================

const todayButton =
    document.getElementById(
        "today-button"
    );


const weekButton =
    document.getElementById(
        "week-button"
    );


const todayView =
    document.getElementById(
        "weather-today-view"
    );


const weekView =
    document.getElementById(
        "weather-week-view"
    );



todayButton.addEventListener(
    "click",
    function () {

        todayView.classList.remove(
            "hidden"
        );


        weekView.classList.add(
            "hidden"
        );


        todayButton.classList.add(
            "active"
        );


        weekButton.classList.remove(
            "active"
        );

    }
);



weekButton.addEventListener(
    "click",
    function () {

        todayView.classList.add(
            "hidden"
        );


        weekView.classList.remove(
            "hidden"
        );


        weekButton.classList.add(
            "active"
        );


        todayButton.classList.remove(
            "active"
        );

    }
);



// =======================================================
// POKEMON HELPERS
// =======================================================

let pokemonCount = null;

let currentPokemonID = null;



function hashString(text) {

    let hash =
        2166136261;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        hash ^=
            text.charCodeAt(i);


        hash =
            Math.imul(
                hash,
                16777619
            );

    }


    return hash >>> 0;

}



// =======================================================
// GET NUMBER OF POKEMON
// =======================================================

async function getPokemonCount() {

    if (pokemonCount !== null) {
        return pokemonCount;
    }


    const response =
        await fetch(
            "/api/pokemon-count"
        );


    if (!response.ok) {

        throw new Error(
            "Could not get Pokemon count"
        );

    }


    const data =
        await response.json();


    pokemonCount =
        data.count;


    return pokemonCount;

}



// =======================================================
// LOAD A POKEMON
// =======================================================

async function loadPokemon(id) {

    try {

        document.getElementById(
            "pokemon-name"
        ).textContent =
            "LOADING...";


        const response =
            await fetch(
                `/api/pokemon/${id}`
            );


        if (!response.ok) {

            throw new Error(
                "Pokemon request failed"
            );

        }


        const data =
            await response.json();


        const pokemon =
            data.pokemon;


        const species =
            data.species;



        // Find an English Pokedex entry

        const englishEntry =
            species.flavor_text_entries.find(

                entry =>
                    entry.language.name === "en"

            );



        let description =
            "NO POKEDEX ENTRY AVAILABLE.";


        if (englishEntry) {

            description =
                englishEntry.flavor_text
                    .replace(
                        /[\n\f\r]+/g,
                        " "
                    );

        }



        document.getElementById(
            "pokemon-name"
        ).textContent =
            pokemon.name.toUpperCase();


        document.getElementById(
            "pokemon-number"
        ).textContent =
            `#${String(
                pokemon.id
            ).padStart(4, "0")}`;


        document.getElementById(
            "pokemon-sprite"
        ).src =
            pokemon.sprites.front_default;


        document.getElementById(
            "pokemon-types"
        ).textContent =
            "TYPE: " +
            pokemon.types
                .map(
                    type =>
                        type.type.name
                            .toUpperCase()
                )
                .join(" // ");


        document.getElementById(
            "pokemon-description"
        ).textContent =
            description;


        currentPokemonID =
            pokemon.id;

    }

    catch (error) {

        console.error(error);


        document.getElementById(
            "pokemon-name"
        ).textContent =
            "CONNECTION ERROR";

    }

}



// =======================================================
// HOURLY POKEMON
// =======================================================

async function loadHourlyPokemon() {

    const count =
        await getPokemonCount();


    const now =
        new Date();


    /*
     * This key stays the same for the entire
     * hour and changes at the next hour.
     */

    const hourKey =
        `${now.getFullYear()}-` +
        `${now.getMonth() + 1}-` +
        `${now.getDate()}-` +
        `${now.getHours()}`;


    const hash =
        hashString(hourKey);


    const pokemonID =
        (hash % count) + 1;


    await loadPokemon(
        pokemonID
    );

}



// =======================================================
// MANUAL RANDOM POKEMON
// =======================================================

async function loadRandomPokemon() {

    const count =
        await getPokemonCount();


    let newID;


    do {

        newID =
            Math.floor(
                Math.random() * count
            ) + 1;

    }

    while (
        newID === currentPokemonID &&
        count > 1
    );


    await loadPokemon(
        newID
    );

}



// =======================================================
// NEW POKEMON BUTTON
// =======================================================

document.getElementById(
    "new-pokemon-button"
).addEventListener(
    "click",
    loadRandomPokemon
);



// =======================================================
// AUTOMATIC CHANGE AT TOP OF EACH HOUR
// =======================================================

function scheduleNextPokemonChange() {

    const now =
        new Date();


    const nextHour =
        new Date(now);


    nextHour.setHours(
        now.getHours() + 1,
        0,
        0,
        0
    );


    const millisecondsUntilNextHour =
        nextHour.getTime() -
        now.getTime();


    setTimeout(
        async function () {

            await loadHourlyPokemon();


            /*
             * Schedule the following hour
             * after this one fires.
             */

            scheduleNextPokemonChange();

        },

        millisecondsUntilNextHour
    );

}


// =======================================================
// BACKGROUND SHOOTING STARS
// =======================================================

function createShootingStar() {

    const skyEffects =
        document.getElementById(
            "sky-effects"
        );


    if (!skyEffects) {
        return;
    }


    const star =
        document.createElement("span");


    const colors = [
        "#FF9FD6",
        "#FFC6A8",
        "#FFF0A3",
        "#B9FBC0",
        "#98F5E1",
        "#A0C4FF",
        "#BDB2FF"
    ];


    star.className =
        "shooting-star";


    star.style.left =
        `${Math.random() * 86}%`;


    star.style.top =
        `${Math.random() * 88}%`;


    star.style.setProperty(
        "--star-color",
        colors[
            Math.floor(
                Math.random() * colors.length
            )
        ]
    );


    star.style.setProperty(
        "--star-distance",
        `${140 + (Math.random() * 120)}px`
    );


    star.style.animationDuration =
        `${850 + (Math.random() * 550)}ms`;


    skyEffects.appendChild(star);


    star.addEventListener(
        "animationend",
        function () {
            star.remove();
        }
    );

}


function scheduleShootingStar() {

    const delay =
        700 + (Math.random() * 1400);


    setTimeout(
        function () {

            const starCount =
                1 + Math.floor(
                    Math.random() * 4
                );


            for (
                let i = 0;
                i < starCount;
                i++
            ) {

                setTimeout(
                    createShootingStar,
                    i * 120
                );

            }

            scheduleShootingStar();

        },

        delay
    );

}



// =======================================================
// START DASHBOARD
// =======================================================

loadWeather();

setInterval(
    loadWeather,
    WEATHER_REFRESH_INTERVAL
);

loadBatteryStatus();

loadHourlyPokemon();

scheduleNextPokemonChange();

scheduleShootingStar();

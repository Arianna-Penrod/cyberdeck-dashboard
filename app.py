import requests

from flask import Flask, jsonify, render_template

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/weather")
def weather():
    params = {
        "latitude": 35.263186434197564,
        "longitude": -97.46300980772602,
        "current": ",".join([
            "temperature_2m",
            "apparent_temperature",
            "weather_code",
            "wind_speed_10m"
        ]),
        "daily": ",".join([
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
            "moon_phase"
        ]),
        "temperature_unit": "fahrenheit",
        "wind_speed_unit": "mph",
        "forecast_days": 7,
        "timezone": "auto"
    }

    try:
        response = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params=params,
            timeout=10
        )

        if not response.ok:
            params["daily"] = params["daily"].replace(
                ",moon_phase",
                ""
            )

            response = requests.get(
                "https://api.open-meteo.com/v1/forecast",
                params=params,
                timeout=10
            )

        response.raise_for_status()

        return jsonify(response.json())

    except requests.RequestException as error:
        return jsonify({
            "error": "Weather request failed",
            "details": str(error)
        }), 502


@app.route("/api/pokemon-count")
def pokemon_count():
    try:
        response = requests.get(
            "https://pokeapi.co/api/v2/pokemon-species",
            params={"limit": 1},
            timeout=10
        )

        response.raise_for_status()

        return jsonify(response.json())

    except requests.RequestException as error:
        return jsonify({
            "error": "Pokemon count request failed",
            "details": str(error)
        }), 502


@app.route("/api/pokemon/<int:pokemon_id>")
def pokemon(pokemon_id):
    try:
        pokemon_response = requests.get(
            f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}",
            timeout=10
        )

        species_response = requests.get(
            f"https://pokeapi.co/api/v2/pokemon-species/{pokemon_id}",
            timeout=10
        )

        pokemon_response.raise_for_status()
        species_response.raise_for_status()

        return jsonify({
            "pokemon": pokemon_response.json(),
            "species": species_response.json()
        })

    except requests.RequestException as error:
        return jsonify({
            "error": "Pokemon request failed",
            "details": str(error)
        }), 502


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5500,
        debug=True
    )

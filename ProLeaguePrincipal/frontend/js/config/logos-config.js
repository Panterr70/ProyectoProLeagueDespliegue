/**
 * logos-config.js — Diccionario centralizado de logos
 * 
 * Contiene el mapeo de nombres de equipos a sus respectivos archivos de imagen.
 * Centralizar esto evita duplicación de código y facilita el mantenimiento.
 * 
 * @author Andoni Villanueva
 */

export const nbaLogos = {
    "Atlanta Hawks": "ATL.png", "Boston Celtics": "BOS.png", "Brooklyn Nets": "BKN.png",
    "Charlotte Hornets": "CHA.png", "Chicago Bulls": "CHI.png", "Cleveland Cavaliers": "CLE.png",
    "Dallas Mavericks": "DAL.png", "Denver Nuggets": "DEN.png", "Detroit Pistons": "DET.png",
    "Golden State Warriors": "GSW.png", "Houston Rockets": "HOU.png", "Indiana Pacers": "IND.png",
    "Los Angeles Clippers": "LAC.png", "Los Angeles Lakers": "LAL.png", "Memphis Grizzlies": "MEM.png",
    "Miami Heat": "MIA.png", "Milwaukee Bucks": "MIL.png", "Minnesota Timberwolves": "MIN.png",
    "New Orleans Pelicans": "NOP.png", "New York Knicks": "NYK.png", "Oklahoma City Thunder": "OKC.png",
    "Orlando Magic": "ORL.png", "Philadelphia 76ers": "PHI.png", "Phoenix Suns": "PHX.png",
    "Portland Trail Blazers": "POR.png", "Sacramento Kings": "SAC.png", "San Antonio Spurs": "SAS.png",
    "Toronto Raptors": "TOR.png", "Utah Jazz": "UTA.png", "Washington Wizards": "WIZ.png"
};

export const nflLogos = {
    "Arizona Cardinals": "NFL_ARI.png", "Atlanta Falcons": "NFL_ATL.png", "Baltimore Ravens": "NFL_BAL.png",
    "Buffalo Bills": "NFL_BUF.png", "Carolina Panthers": "NFL_CAR.png", "Chicago Bears": "NFL_CHI.svg",
    "Cincinnati Bengals": "NFL_CIN.png", "Cleveland Browns": "NFL_CLE.png", "Dallas Cowboys": "NFL_DAL.svg",
    "Denver Broncos": "NFL_DEN.svg", "Detroit Lions": "NFL_DET.png", "Green Bay Packers": "NFL_GB.png",
    "Houston Texans": "NFL_HOU.png", "Indianapolis Colts": "NFL_IND.svg", "Jacksonville Jaguars": "NFL_JAX.png",
    "Kansas City Chiefs": "NFL_KC.png", "Las Vegas Raiders": "NFL_LV.png", "Los Angeles Chargers": "NFL_LAC.png",
    "Los Angeles Rams": "NFL_LAR.png", "Miami Dolphins": "NFL_MIA.png", "Minnesota Vikings": "NFL_MIN.png",
    "New England Patriots": "NFL_NE.png", "New Orleans Saints": "NFL_NO.png", "New York Giants": "NFL_NYG.png",
    "New York Jets": "NFL_NYJ.svg", "Philadelphia Eagles": "NFL_PHI.png", "Pittsburgh Steelers": "NFL_PIT.png",
    "San Francisco 49ers": "NFL_SF.svg", "Seattle Seahawks": "NFL_SEA.png", "Tampa Bay Buccaneers": "NFL_TB.svg",
    "Tennessee Titans": "NFL_TEN.svg", "Washington Commanders": "NFL_WAS.png"
};

// Alias para compatibilidad con Scoreboard si es necesario
export const SB_NBA_LOGOS = nbaLogos;
export const SB_NFL_LOGOS = nflLogos;

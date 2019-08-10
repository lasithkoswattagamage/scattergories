const PLAYER_LIST_KEY = "abcd"
const GAME_DATA_KEY = "efgh"
// This class will be dedicated to storing eac Player's name
// their score. This class will require to be able to be initialised
// from local storage
class Player
{
    constructor(name)
    {
        this._name = name
        this._score = 0
    }

    get name()
    {
        return this._name
    }

    get score()
    {
        return this._score
    }

    set score(newScore)
    {
      this._score = newScore
    }

    addPoints(pointsToAdd)
    {
        this._score += pointsToAdd
    }

    initialiseFromPDO(playerPDO)
    {
        this._name = playerPDO._name
        this._score = Number(playerPDO._score)
    }
}


class PlayerList
{
    constructor()
    {
        this._players = []
    }

    get players()
    {
        return this._players
    }

    addPlayer(newPlayer)
    {
        this._players.push(newPlayer)
    }

    // If player is already in list, than it returns it's index.
    // If not than it returns -1
    indexOfPlayer(name)
    {
        let playerList = this._players
        for (let i=0;i++;i<playerList.length)
        {
            if (playerList[i].name===name)
            {
                return i
            }
        }
        return -1
    }

    setScore(name,newPoints)
    {
        let playerIndex = this.indexOfPlayer(name)
        if (playerIndex!==-1)
        {
            this._players[playerIndex].addPoints(newPoints)
        }
    }

    reset()
    {
        this._players = []
    }

    setScoreToZero()
    {
      for (let i=0;i<this._players.length;i++)
      {
        this._players[i].score = 0
      }
    }
    initialiseFromPDO(playerListPDO)
    {
        let playerList = playerListPDO._players
        for (let i=0;i<playerList.length;i++)
        {
            let tempPlayer = new Player()
            tempPlayer.initialiseFromPDO(playerList[i]);
            this._players.push(tempPlayer)
        }
    }
}

class GameData
{
    constructor()
    {
        this._timer = 15 // Amount of seconds to put down answer
        this._startTimer = 3 // Amount of seconds to start timer
        this._categories = ["Colours", "TV Shows/Movies", "Animal", "Name", "Fruits", "Sports", "Famous Person", "Brands", "Countries", "Muscles"] // Default
        this._ascii = "ABCDEFGHIJKLMNOPQRSTUVWYZ".split("")
    }

    get categories()
    {
        return this._categories
    }

    set categories(newCategories)
    {
        this._categories = newCategories
    }

    get ascii()
    {
        return this._ascii
    }

    set ascii(newAscii)
    {
      this._ascii = newAscii
    }

    get timer()
    {
        return this._timer
    }

    resetAscii()
    {
      this._ascii = "ABCDEFGHIJKLMNOPQRSTUVWYZ".split("")
    }

    resetCategories()
    {
      this._categories = this._categories = ["Colours", "TV Shows/Movies", "Animal", "Name", "Fruits", "Sports", "Famous Person", "Brands", "Countries", "Muscles"] // Default Config
    }

    get startTimer()
    {
        return this._startTimer
    }
    randomLetter(index)
    {
        let randomIndex = Math.floor(Math.random()*this._ascii.length)
        let randomLetter = this._ascii[randomIndex]
        this._ascii.splice(randomIndex,1) // Remove letter to avoid mid-game conflicts and add finishing point
        return randomLetter
    }

    initialiseFromPDO(gameDataPDO)
    {
        this._timer = Number(gameDataPDO._timer)
        this._ascii = gameDataPDO._ascii
        this._categories = gameDataPDO._categories
    }

    attemptsRemaining()
    {
        return this._ascii.length
    }
}
// Functions dedicated to placing and extracting PlayerList Class from localStorage and
// placing it into local storage
function savePlayerList(playerList)
{
  let playerListStr = JSON.stringify(playerList)
  localStorage.setItem(PLAYER_LIST_KEY, playerListStr)
}

function loadPlayerList(playerList)
{

  let playerListStorage = localStorage.getItem(PLAYER_LIST_KEY)
  let playerListObj = JSON.parse(playerListStorage)
  if (playerListStorage!==null)
  {
      playerList.initialiseFromPDO(playerListObj)
  }
}

function saveGameData(gameData)
{
  let gameDataStr = JSON.stringify(gameData)
  localStorage.setItem(GAME_DATA_KEY, gameDataStr)
}

function loadGameData(gameData)
{

  let gameDataStorage = localStorage.getItem(GAME_DATA_KEY)
  let gameDataObj = JSON.parse(gameDataStorage)
  if (gameDataStorage!==null)
  {
      gameData.initialiseFromPDO(gameDataObj)
  }
}

function displayPlayers(game,sortMethod)
{
    let playerList = [...newGame.players]
    if (sortMethod==="ASCENDING")
    {
        playerList.sort(function(a,b){return b.score-a.score})
    }

    for (let i=0;i<playerList.length;i++)
    {
      addPlayer(playerList[i]) //addPlayer function is used to display players on table
    }
}

// This function is dedicated to focusing on an input when provided its ID
function focusOnInput(inputID)
{
    let inputRef = document.getElementById(inputID)
    inputRef.focus()
    inputRef.select()
}

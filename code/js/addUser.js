
// This function will add a row dedicated to entering a new players name
function addInput(tableID)
{
  // Only create input box if it is not present within table
  let tableRef = document.getElementById(tableID)
  let inputRef = tableRef.querySelector("input")
  if (inputRef===null)
  {
    let row = document.createElement("tr")
    row.className = "input-row"
    let column = document.createElement("td")
    let input = document.createElement("input")
    let score = document.createElement("td")
    input.addEventListener("keypress", confirmInput)
    input.id = tableID+"_input"

    // Append relevant HTML elements to each parent to form an input row on the table
    column.appendChild(input)
    row.appendChild(column)
    row.appendChild(score)
    tableRef.appendChild(row)
    focusOnInput(input.id)
  }
}

// This function will add the player into the playerList and then remove the input
// box to satisfy design principles

function confirmInput(e)
{
  if (e.keyCode===13)
  {
    let inputRef = this
    let tableRef = this.parentElement.parentElement.parentElement

    // Extract name and add to newGam
    let input = inputRef.value


    // Extract name and create table row
    let row = document.createElement("tr")
    let item = document.createElement("td")
    let score = document.createElement("td")
    item.innerText = input
    item.className = "mdl-data-table__cell--non-numeric"

    if (this.id==="listOfPlayers_input")
    {
      score.innerText = "0"
      let newPlayer = new Player(input)
      newGame.addPlayer(newPlayer)
    }

    // Append relevant HTML elements to each parent to form an input row on the table
    inputRef.parentElement.parentElement.remove()
    row.appendChild(item)
    row.append(score)
    tableRef.appendChild(row)

    // Scan the table of categories to update the addition that was made
    scanCategories(gameData)
    saveGameData(gameData)
  }
}

function saveAndExit()
{
  if (newGame.players.length>0)
  {
    scanCategories(gameData)
    savePlayerList(newGame)
    saveGameData(gameData)
    location.href = "RandomTest.html"
  }
}

function addPlayer(Player)
{
    let row = document.createElement("tr")
    let name = document.createElement("td")
    name.className = "mdl-data-table__cell--non-numeric"
    name.innerText = Player.name
    let score = document.createElement("td")
    score.innerText = Player.score
    let tableRef = document.getElementById("listOfPlayers")

    // Append relevant HTML elements to each parent to form an input row on the table
    row.appendChild(name)
    row.appendChild(score)
    tableRef.appendChild(row)
}

function displayCategories()
{
    let tableRef = document.getElementById("listOfCategories")
    tableRef.innerHTML = ""
    //
    for (let i=0; i<gameData.categories.length;i++)
    {
      let row = document.createElement("tr")
      row.addEventListener("click", () => {
        row.remove()
        scanCategories(gameData)
        saveGameData(gameData)
      })
      let filler = document.createElement("td")
      let category = document.createElement("td")
      category.className = "mdl-data-table__cell--non-numeric"
      category.innerText = gameData.categories[i]

      // Append relevant HTML elements to each parent to form an input row on the table
      row.appendChild(category)
      row.append(filler)
      tableRef.appendChild(row)
    }
}

function resetCategories()
{
  gameData.resetCategories()
  saveGameData(gameData)
  displayCategories()

}
function toggleCategories()
{
  let tableStyle = document.getElementById("categoryTable").style
  if (tableStyle.visibility==="hidden")
  {
    tableStyle.visibility="visible"
  } else
  {
    tableStyle.visibility="hidden"
  }
}
function scanCategories(gameData)
{
  let tableRef = document.getElementById("listOfCategories")
  let scannedCategories = []
  for (let i=0, row; row=tableRef.rows[i];i++)
  {
    let category = row.querySelector("td").innerHTML
    scannedCategories.push(category)
  }
  gameData.categories = scannedCategories
}

function clearPlayers()
{
  let tableRef = document.getElementById("listOfPlayers")
  let gameOverStyle = document.querySelector(".game-over").style
  if (gameOverStyle.display==="block")
  {
    gameOverStyle.display = "none"
  }
  tableRef.innerHTML = ""

  //Reset PlayerList
  newGame = new PlayerList()
  savePlayerList(newGame)
}

let newGame = new PlayerList()
let gameData = new GameData()
loadPlayerList(newGame)
loadGameData(gameData)
displayPlayers(newGame, "ASCENDING")
displayCategories()

if (gameData.ascii.length===0)
{
  gameOver()
}

function gameOver()
{
  let textRef = document.querySelector(".game-over")
  let buttonRef = document.querySelectorAll("button")
  textRef.style.display = "block"
  gameData.resetAscii()
  newGame.setScoreToZero()
  saveGameData(gameData)
  savePlayerList(newGame)
}

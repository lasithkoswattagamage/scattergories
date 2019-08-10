

function saveAndExit(e)
{
    if (e!==undefined)
    {
        if (e.keyCode === 13) {
            addPoints(newGame)
            savePlayerList(newGame)
            location.href = "addUsers.html"
        }
    } else
    {
            addPoints(newGame)
            savePlayerList(newGame)
            location.href = "addUsers.html"
    }

}

function addPlayer(Player)
{
    let tableRef = document.getElementById("listOfPlayers")
    //
    let row = document.createElement("tr")
    let name = document.createElement("td")
    name.className = "mdl-data-table__cell--non-numeric"
    name.innerText = Player.name
    let score = document.createElement("td")
    let input = document.createElement("input")
    score.appendChild(input)


    // Append relevant HTML elements to each parent to form an input row on the table
    row.appendChild(name)
    row.appendChild(score)
    tableRef.appendChild(row)
}

function addPoints(game)
{
    let tableRef = document.querySelector("table")
    let playerList = game.players
    for (let i=1, row; row=tableRef.rows[i];i++)
    {
        let points = Number(row.querySelector("input").value)
        if (points>0)
        {
            playerList[i - 1].addPoints(points)
        }
    }
}

let newGame = new PlayerList()
loadPlayerList(newGame)
displayPlayers(newGame)

let inputRef = document.querySelector("input")
inputRef.focus()
inputRef.select()
document.addEventListener("keypress", saveAndExit) //Read table after all points entered



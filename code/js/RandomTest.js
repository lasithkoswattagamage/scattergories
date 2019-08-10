let gameData = new GameData()
loadGameData(gameData)

// Event Listeners
document.addEventListener("keyup", start)

// HTML Related
let timerRef = document.querySelector(".timer")


// Code
function randomizeLetter()
{
    // Randomize Letter
    let letterRef = document.querySelector(".randomLetter")
    letterRef.innerText = gameData.randomLetter()
    saveGameData(gameData)
}

function randomizeCategory()
{
    let tempCategories = [...gameData.categories] //Requires decentralization
    for (let i=0;i<4;i++)
    {
        let randomCat = Math.floor(Math.random() * tempCategories.length)
        let cellRef = document.getElementById("cat" + i)
        if (tempCategories[randomCat]!==undefined)
        {
            cellRef.innerText = tempCategories[randomCat]
            tempCategories.splice(randomCat, 1) // Remove category after selected to avoid it appearing twice
        } else
        {
            cellRef.innerText = ""
        }
    }

}


function startTimer(seconds, executeFunc)
{
    timerRef.style.color = "rgb(0,0,0)"
    timerRef.innerText = ""
    function changeTime()
    {

        if (seconds<=5)
        {
            timerRef.style.color = "rgb(255,64,129)"
        }
        if (seconds>=0)
        {
            timerRef.innerText = seconds
            seconds -= 1
            setTimeout(changeTime,1000)
        } else
        {
            executeFunc()
        }
    }


    setTimeout(changeTime, 1000) // 1 second delay before changing time

}

function start()
{
    randomizeCategory()
    randomizeLetter()
    startTimer(gameData.timer, ()=> location.href="addPoints.html")
}

startTimer(gameData.startTimer, start)




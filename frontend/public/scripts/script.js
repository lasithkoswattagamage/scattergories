$(document).ready(function () {
  var socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });
  var letters = "abcdefghijklmnopqrstuvwxtz".split("");

  function isdefined(state) {
    return state !== "undefined";
  }

  function sortScoreboard(scoreboard) {
    scoreboard.sort((a, b) => b.points - a.points);
  }

  function generateRoomCode(callback) {
    $.ajax({
      type: "GET",
      dataType: "json",
      url: "/generate-room-code",
      success: function (data) {
        let roomCode = data.roomCode;
        callback(data.roomCode);
      },
    });
  }

  function emptyGameState() {
    $(gameState).css("display", "none");
    gameState = null;
  }

  function playClearInputs() {
    $(".play__input").each(function (index) {
      $(this).val("");
    });
  }

  function triggerLobby() {
    emptyGameState(); // Clear any previously displayed component
    playClearInputs(); // Clear inputs
    gameState = ".lobby";
    $(gameState).css("display", "block");
  }

  function primePlay() {
    emptyGameState(); // Clear any previously displayed component
    gameState = ".play";
    $(gameState).css("display", "block");
    // Deactivate Answering Block
    $(gameState + "--js").css("display", "none");
  }

  function triggerPlay() {
    // Activate Answering Block
    $(gameState + "--js").css("display", "flex");
    // Deactivate Horizontal Progress Bar
    $("#lobby__bar-container").css("display", "none");
    $("#play__bar-container").css("display", "none");
  }

  function primeDecide() {
    emptyGameState(); // Clear any previously displayed component
    gameState = ".decide";
    // Activate Decide
    $(gameState).css("display", "block");
    $(".decide__answers-container").html("");
    $(".decide__options-container").css("display", "none");
  }

  function triggerDecide() {
    $(".decide__input").off("click");
  }

  function populatePlay(gameData) {
    // let gameData = {
    //     roundTime,
    //     categories: ["Cars","Phones","Fruits","Movies"],
    //     letter: "a"
    //   }
    // Populate Big Letter
    $(".play__header--primary").text(gameData.letter);

    // Populate Categories
    $(".play__header--secondary").each(function (index) {
      // $(this) is referring to the particular heading
      $(this).text(gameData.categories[index]);
    });
    // Populate Inputs
    //
    // Populate Input Placeholders
    // $(".play__input").each(function(index){
    //     $(this).attr("placeholder",gameData.categories[index]);
    // })
    // Populate Input Labels
    $(".play__label").each(function (index) {
      $(this).text(gameData.categories[index]);
    });
  }

  // This function requests the server for the users role. This is done by looking at socket.role
  // server-side
  function isAdmin(callback) {
    socket.emit("isAdmin", callback);
  }

  // This function requests the server for the users role. This is done by looking at socket.roomCode
  // server-side
  function getRoomCode(callback) {
    socket.emit("getRoomCode", callback);
  }

  // This is a non-blocking animation that asynchronously scales the progress Bar. This is a solution to the problem
  // where having a long css animation + interacting with the inputs lead to some nasty lag.
  function progressBarVertical(secs, secsIncrement) {
    for (let i = secs; i >= 0; i -= secsIncrement) {
      setTimeout(() => {
        $(".play__v-progressBar-bar").css(
          "flex",
          "0 0 " + (i * 100) / secs + "%"
        );
      }, secs * 1000 - 1000 * i);
    }
  }

  function resetProgressBarVertical() {
    $(".play__v-progressBar-bar").css("flex", "0 0 100%");
  }

  function progressBarHorizontal(id, secs, secsIncrement) {
    for (let i = secs; i >= 0; i -= secsIncrement) {
      setTimeout(() => {
        $("#" + id + "__bar").css("flex", "0 0 " + (i * 100) / secs + "%");
      }, secs * 1000 - 1000 * i);
    }
  }

  function resetProgressBarHorizontal(id) {
    $("#" + id + "__bar").css("flex", "0 0 100%");
  }

  function displayDecideData(data, categories, isAdmin) {
    let main_fragment = document.createDocumentFragment();
    // Change the categories - tbd
    // $("decide__table--category").each(function(index){
    //     $(this).text(data)
    // })
    //categories = ["CategoryA","CategoryB","CategoryC",...]
    //data = [{socketId,userName,pos,response:["ResponseA","ResponseB","ResponseC",...]}]
    console.log(categories);
    console.log(data);

    // Create Answer Block-User Block
    let user_fragment = document.createElement("div");
    user_fragment.className = "decide__answers-user-block";

    // Create Answer Response Block
    let user_answer_response = displayDecideData_user_block(data);
    user_fragment.appendChild(user_answer_response);
    main_fragment.appendChild(user_fragment);

    // Create ResponseBlock
    let response_fragment = document.createDocumentFragment();

    let response_group = displayDecideData_user_resp_block(data, categories);
    response_fragment.appendChild(response_group);
    console.log(response_fragment);
    main_fragment.appendChild(response_fragment);

    // Create Submit Button
    //     <div class="decide__submit--button decide__answers-submit">
    //     <button class="decide__submit-decision login__button login__button--orange" type="submit">Confirm</a>
    // </div>
    let submit_button_group = document.createElement("div");
    submit_button_group.className =
      "decide__submit--button decide__answers-submit";
    let submit_button = document.createElement("button");
    submit_button.className =
      "decide__submit-decision login__button login__button--orange";
    submit_button.type = "submit";
    submit_button.innerText = "Confirm";
    // Combine Child
    submit_button_group.appendChild(submit_button);
    main_fragment.appendChild(submit_button_group);

    return main_fragment;
  }

  function displayDecideData_user_block(data) {
    //data = [{socketId,userName,pos,response:["ResponseA","ResponseB","ResponseC",...]}]
    let user_fragment = document.createDocumentFragment();

    // Create PlaceHolder Flex Container
    let user_placeholder = document.createElement("div");
    user_placeholder.className =
      "decide__rail-group decide__rail-group--category";
    let user_placeholder_rail = document.createElement("div");
    user_placeholder_rail.className = "decide__rail decide__rail--invisible";
    let user_placeholder_text = document.createElement("span");
    user_placeholder_text.className = "decide__rail--name";
    user_placeholder_text.innerText = "Placeholder";
    // Start Combining Child Elements
    user_placeholder_rail.appendChild(user_placeholder_text);
    user_placeholder.appendChild(user_placeholder_rail);
    user_fragment.appendChild(user_placeholder);

    // Create UserName Flex Containers
    data.forEach((user) => {
      let user_block = document.createElement("div");
      user_block.className = "decide__rail-group";
      let user_block_rail = document.createElement("div");
      user_block_rail.className = "decide__rail decide__rail--" + user.pos;
      let user_block_name = document.createElement("span");
      user_block_name.className = "decide__rail--name";
      user_block_name.innerText = user.userName;
      // Start Combining Child Elements
      user_block_rail.appendChild(user_block_name);
      user_block.appendChild(user_block_rail);
      user_fragment.appendChild(user_block);
    });

    console.log(user_fragment);
    return user_fragment;
  }

  function displayDecideData_user_resp_block(data, categories) {
    //categories = ["CategoryA","CategoryB","CategoryC",...]
    //data = [{socketId,userName,pos,response:["ResponseA","ResponseB","ResponseC",...]}]
    let response_fragment = document.createDocumentFragment();

    categories.forEach((category, categoryIndex) => {
      let response_user_fragment = document.createElement("div");
      response_user_fragment.className = "decide__answers-response-block";

      // Creating Category Rail
      let response_rail_group = document.createElement("div");
      response_rail_group.className =
        "decide__rail-group decide__rail-group--category";
      let response_rail = document.createElement("div");
      response_rail.className = "decide__rail decide__rail--category";
      let response_text = document.createElement("span");
      response_text.className = "decide__rail--span-category";
      response_text.innerText = category;
      // Start Combining Child Elements
      response_rail.appendChild(response_text);
      response_rail_group.appendChild(response_rail);
      response_user_fragment.appendChild(response_rail_group);

      // Creating User Response Input Rail
      // Note: Category Index is Same as Response Index
      data.forEach((user, userIndex) => {
        let response_input_group = document.createElement("div");
        response_input_group.className = "decide__input-group";

        let userName = user.userName;
        let response = user.response[categoryIndex];

        // If a user fails to respond. Then response will be null
        let options = ["incorrect", "unique", "same"];
        if (response) {
          // Create CheckBoxes
          options.forEach((option) => {
            let response_checkbox = document.createElement("input");
            response_checkbox.type = "radio";
            response_checkbox.className =
              "decide__radio--res decide__radio--" + option;
            response_checkbox.setAttribute(
              "name",
              userIndex + "-" + categoryIndex
            ); // element.name is readOnly
            response_checkbox.value = option;
            response_checkbox.required = true;
            // Combine Child Elements
            response_input_group.appendChild(response_checkbox);
          });

          // Create Input
          let response_input = document.createElement("div");
          response_input.className = "decide__input";
          response_input.setAttribute("rel", userIndex + "-" + categoryIndex);
          // Create Name Span Element
          let response_name = document.createElement("span");
          response_name.className = "decide__input-name";
          response_name.innerText = userName;

          // Create Response Text Element
          response_text = document.createElement("span");
          response_text.className = "decide__input-text";
          response_text.innerText = response;

          // Combine Child Elements
          response_input.appendChild(response_name);
          response_input.appendChild(response_text);
          response_input_group.appendChild(response_input);
        } else {
          // Create CheckBox

          let response_checkbox = document.createElement("input");
          response_checkbox.type = "radio";
          response_checkbox.className =
            "decide__radio--res decide__radio--incorrect";
          response_checkbox.setAttribute(
            "name",
            userIndex + "-" + categoryIndex
          ); // element.name is readOnly
          response_checkbox.value = "incorrect";
          response_checkbox.required = true;
          response_checkbox.checked = true;
          // Combine Child Elements
          response_input_group.appendChild(response_checkbox);

          // Create Input
          let response_input = document.createElement("div");
          response_input.className = "decide__input";
          response_input.setAttribute("rel", userIndex + "-" + categoryIndex);
          // Create Response Text Element
          response_text = document.createElement("span");
          response_text.className = "decide__input-text";
          response_text.innerText = "Not Responded";

          response_input.appendChild(response_text);
          response_input_group.appendChild(response_input);
        }
        // Combining Input Group with main fragment
        response_user_fragment.appendChild(response_input_group);
      });

      // Combining User Fragment with main fragment
      response_fragment.appendChild(response_user_fragment);
    });

    return response_fragment;
  }

  $(".login__form-create").on("submit", function (e) {
    e.preventDefault();
    generateRoomCode(function (roomCode) {
      var userName = $("#name_create").val();
      if (isdefined(typeof roomCode)) {
        // Joining Room
        // {userName, roomCode} => Data sent to server
        // function(err,message) => Callback after server responds whether room was joined successfully/unsuccessfully
        socket.emit(
          "login--create-room",
          { userName, roomCode, role: "admin" },
          function (error, message) {
            console.log(message);
            if (!error) {
              // Join Socket To Room
              // Set display of login to none
              // Set display of lobby to ""
              window.location = "/#";
              triggerLobby();
              socket.emit("lobby--joined");
              isAdmin(function (isAdmin) {
                console.log(isAdmin);
              });
              getRoomCode(function (roomCode) {
                console.log(roomCode);
              });
            }
          }
        );
      } else {
        window.location = "/#";
      }
    });
  });

  $(".lobby__settings-form").on("submit", function (e) {
    e.preventDefault();
    // Prevent non-admins from malicously starting this game
    isAdmin(function (isAdmin) {
      if (isAdmin) {
        let numberOfRounds = $("#lobby_rounds").val();
        let roundTime = $("#lobby_time").val();
        if (!isNaN(numberOfRounds) && !isNaN(roundTime)) {
          numberOfRounds = Number(numberOfRounds);
          roundTime = Number(roundTime);
          if (numberOfRounds >= 1 && numberOfRounds <= 26 && roundTime >= 10) {
            socket.emit("lobby--start-game", { numberOfRounds, roundTime });
          }
        }
      }
    });
  });

  $(".login__form-join").on("submit", function (e) {
    e.preventDefault(); // Prevent Page from Reloading
    var userName = $("#name_join").val();
    var roomCode = $("#room_join").val().toUpperCase();

    // Before we join a room, we must first determine if the room exists in the first place
    socket.emit("login--room-exists", { roomCode }, function (errorA, message) {
      if (!errorA) {
        console.log("Room Exists");
        socket.emit(
          "login--join-room",
          { userName, roomCode, role: "user" },
          function (errorB, message) {
            if (!errorB) {
              window.location = "/#";
              triggerLobby();
              socket.emit("lobby--joined");
            }
          }
        );
      } else {
        // Need to create an alert through JS
        console.log("Room Does Not Exist");
      }
    });
  });

  $("#decide__form").submit(function (e) {
    e.preventDefault();
    let formData = $(this).serializeArray();
    let indexedFormData = {};
    formData.forEach((obj) => {
      indexedFormData[obj.name] = obj.value;
    });
    isAdmin(function (isAdmin) {
      if (isAdmin) {
        socket.emit("decide--submitted", indexedFormData);
      }
    });
  });

  $(".decide__finalise").on("click", function (e) {
    e.preventDefault();
    $(".decide__submit-decision").trigger("click");
  });

  socket.on("lobby--build", function (scoreboard, playerLimit) {
    // Prevent reloading lobby if game has finished
    sortScoreboard(scoreboard);
    getRoomCode(function (roomCode) {
      // Change Room Code on Lobby
      $(".lobby__room-code--primary").text(roomCode);
    });

    isAdmin(function (isAdmin) {
      if (isAdmin) {
        // Make Ladder Container and Settings Container Visible (display: block)
        $(".lobby__ladder-container").css("display", "flex");
        $(".lobby__settings-container").css("display", "block");
      } else {
        // Make Ladder Container and Settings Container Invisible (display: block)
        $(".lobby__ladder-container").css("display", "flex");
        $(".lobby__settings-container").css("display", "none");
      }
      // Update ScoreBoard
      // <div class="lobby__rail lobby__rail--1">
      // <span class="lobby__rail--name">Liam</span>
      // <span class="lobby__rail--score">0</span>
      // </div>
      $(".lobby__ladder--js").html("");
      // Update Lobby Ladder With All Players on the scoreboard
      scoreboard.forEach((player) => {
        let user_rail = $(
          `<div class='lobby__rail lobby__rail--${player.pos}'></div>`
        );
        user_rail.append(
          $(`<span class='lobby__rail--name'>${player.name}</span>`)
        );
        user_rail.append(
          $(`<span class='lobby__rail--score'>${player.points}</span>`)
        );
        $(".lobby__ladder--js").append(user_rail);
      });
      $(".lobby__header--sub").text(
        "Players: " + scoreboard.length + "/" + playerLimit
      );
    });
  });

  socket.on("lobby--ingame-build", function (scoreboard, roundsRemaining) {
    triggerLobby();
    sortScoreboard(scoreboard);

    // Scroll To The Top Of the Page
    window.scrollTo(0, 0);

    $(".lobby__settings-container").css("display", "none");

    // Update ScoreBoard
    // <div class="lobby__rail lobby__rail--1">
    // <span class="lobby__rail--name">Liam</span>
    // <span class="lobby__rail--score">0</span>
    // </div>
    $(".lobby__ladder--js").html("");
    // Update Lobby Ladder With All Players on the scoreboard
    scoreboard.forEach((player) => {
      let user_rail = $(
        `<div class='lobby__rail lobby__rail--${player.pos}'></div>`
      );
      user_rail.append(
        $(`<span class='lobby__rail--name'>${player.name}</span>`)
      );
      user_rail.append(
        $(`<span class='lobby__rail--score'>${player.points}</span>`)
      );
      $(".lobby__ladder--js").append(user_rail);
    });

    // Remove Room Code if it exists and replace with rounds remaining
    $(".lobby__header--sub").text("Rounds Remaining: " + roundsRemaining);

    // Activate Horizontal Progress Bar
    $("#lobby__bar-container").css("display", "flex");

    // Reset Progress Bar from previous rounds
    resetProgressBarHorizontal("lobby");
    // Trigger Progress Bar for x amount of seconds (provided by S)
    progressBarHorizontal("lobby", 5, 0.01);
  });

  socket.on("lobby--finished", function (scoreboard) {
    triggerLobby();
    sortScoreboard(scoreboard);
    $(".lobby__ladder-container").css("display", "flex");
    $(".lobby__settings-container").css("display", "none");

    // Update ScoreBoard
    // <div class="lobby__rail lobby__rail--1">
    // <span class="lobby__rail--name">Liam</span>
    // <span class="lobby__rail--score">0</span>
    // </div>
    $(".lobby__ladder--js").html("");
    // Update Lobby Ladder With All Players on the scoreboard
    scoreboard.forEach((player) => {
      let user_rail = $(
        `<div class='lobby__rail lobby__rail--${player.pos}'></div>`
      );
      user_rail.append(
        $(`<span class='lobby__rail--name'>${player.name}</span>`)
      );
      user_rail.append(
        $(`<span class='lobby__rail--score'>${player.points}</span>`)
      );
      $(".lobby__ladder--js").append(user_rail);
    });

    //Change text of Lobby Header to indicate that the game is finished
    $(".lobby__header").text("Final Rankings");

    // Remove rounds remainin and replace with empty html
    $(".lobby__header--sub").css("display", "none");
  });

  socket.on("play--prime", function (waitTime) {
    console.log("Play is Primed");
    // Prime the playing area for gameData

    $("#play__bar-container").css("display", "flex");
    primePlay();
    // Reset Progress Bar from previous rounds
    resetProgressBarHorizontal("play");
    // Trigger Progress Bar for x amount of seconds (provided by S)
    window.scrollTo(0, 0);
    progressBarHorizontal("play", 3, 0.01);
  });

  socket.on("play--build", function (gameData) {
    console.log("Play is Built");
    console.log(gameData);
    // Data required
    // let gameData = {
    //     roundTime,
    //     categories: ["Cars","Phones","Fruits","Movies"],
    //     letter: "a"
    //   }

    // Trigger the playing area
    primePlay();
    triggerPlay();
    //Reset Progress Bar from previous rounds
    resetProgressBarVertical();
    // Trigger the vertical horizontal progress bar
    progressBarVertical(gameData.roundTime, 0.03);
    // Populate all the neccessary elements with gameData
    populatePlay(gameData);
  });

  socket.on("decide--prime", function () {
    console.log("DECIDE_PRIME");
    primeDecide();
    // Extract all user responses
    userResponses = [];
    $(".play__input").each(function () {
      let inputResponse = $(this).val();
      if (inputResponse) {
        userResponses.push(inputResponse);
      } else {
        userResponses.push(null);
      }
    });

    socket.emit("play--submitted", userResponses);

    //    => Array
    // Build Prime Screen
  });

  socket.on("decide--build", function (responses, categories) {
    console.log("DECIDE_BUILD");
    // Need to Inject Categories Here
    triggerDecide();

    isAdmin(function (isAdmin) {
      // Display all the results
      // if Admin => Build the admin screen
      let flexData = displayDecideData(responses, categories, isAdmin);
      document
        .querySelector(".decide__answers-container")
        .appendChild(flexData);

      if (isAdmin) {
        // Display Options if Admin
        $(".decide__options-container").css("display", "flex"); //Enable options
        $(".decide__options-wait").css("display", "none"); // Disable Wait Response
        $(".decide__answers-container").css("pointer-events", "all"); // Enable clicking of inputs
        $(".decide__input").attr("disabled", false);
        $(".decide__submit-decision").css("display", "inline-block"); // Enable Confirm Button
      } else {
        // Dispaly Wait Message to Users
        $(".decide__options-container").css("display", "none"); //Disable options
        $(".decide__options-wait").css("display", "flex"); //Enable wait response
        $(".decide__answers-container").css("pointer-events", "none"); // Disable clicking of inputs
        $(".decide__input").attr("disabled", true);
        $(".decide__submit-decision").css("display", "none"); // Disable orange confirm button
      }

      $(".decide__input").on("click", function () {
        // Extract what decide mode we are currently in "Incorrect, Same, Unique"
        let decide_option = $('input[name="decide-option"]:checked').val();
        // Search for a radio input in the parent element that has a value attribute that
        // matches the mode we are currently in
        $(this)
          .parent()
          .find(`input[value='${decide_option}']`)
          .prop("checked", true);
      });
    });
  });

  let gameState = ".login";

  // This prevents the page from scrolling down to where it was previously.
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
});

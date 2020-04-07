
console.log('Starting ' + window.location.href);

var questionTitle = "";

var frame = $(document).find("iframe").eq(0);
var frameContent = frame.contentDocument;
window.setInterval(function(){
	var newQuestionTitle = extractQuestionTitle();
	if (questionTitle != newQuestionTitle) {
		questionTitle = newQuestionTitle;
		requestAnswer(questionTitle);
		createAnswersArea();
		addMd5HashesToAnswers();
		bindButton();
	}
}, 1000);

createAnswersArea();


function createAnswersArea() {
	if (!$( "#answers", frameContent ).length) {
		$( ".question-section", frameContent ).append( '<div id="answers" class="message-box"></div>' );
	}
}

function showMessage(message) {
	$( "#answers", frameContent ).html( message );
}

function bindButton(){
	$("button[ref='submitButton']", frameContent).one("click", function() {
		saveAnswers();
	})
}

function extractQuestionTitle() {
	var element = $(".mdc-typography--subheading2.au-target.markup-text > div", frameContent).eq(0).html();
	return element;
}

function saveAnswers() {
	var md5 = MD5(questionTitle);
	var indexArray = [];
	indexArray.push(md5);
	console.log('Question: ' + questionTitle);
	console.log('Question MD5: ' + md5);
	setTimeout(function(){
		var answers = [];
		$("i.au-target:contains('check_circle')", frameContent).each(function (el) {
			var answerText = $(this).closest('label').find('markup-text > div.au-target').text();
			var answerMd5 = MD5(answerText);
			answers.push({"md5":answerMd5, "text":answerText});
		});
		console.log('Answers: ', answers);
		var newEntry = {};
		newEntry[md5] = answers;
		chrome.storage.local.set(newEntry, function() {
		  console.log('Settings saved');
		  chrome.storage.local.get(indexArray, function(items) {
		  	  console.log("Saved ", items);
			  if (items[md5] && items[md5].length) {
			  	showMessage(`<p class="message-success">Saved ${items[md5].length} answers.</p>`);
			  } else {
			  	showMessage(`<p class="message-error">Error: Cannot save in storage ${md5}</p>`);
			  }
			});
		});
	}, 1500);
}

function addMd5HashesToAnswers() {
	$(".mdc-list-item markup-text > div", frameContent).each(function (el) {
      var elementTextMd5 = MD5($(this).text());
      $(this).closest('markup-text').append(`<div class='answer-hash'>${elementTextMd5}</div>`);
  	});
}

function highlightCorrectAnswer(correctAnswerMd5) {
	$(".mdc-list-item markup-text > div", frameContent).each(function (el) {
      var elementText = $(this).text();
      var elementTextMd5 = MD5(elementText);
      if (elementTextMd5 === correctAnswerMd5) {
      	console.log('Found! ' + elementTextMd5);
      	$(this).closest('li').css("background-color", "#7FFFD4");
      }
  	});
}

function requestAnswer(question){
	if (question == undefined || question == '') {
		return;
	}
	console.log("requestAnswer " + question);
	var questionMd5 = MD5(question);
	console.log("questionMd5 " + questionMd5);
    chrome.storage.local.get(questionMd5, function(items) {
      console.log("items " + JSON.stringify(items));
      var answers = items[questionMd5];
      if (!answers || !answers.length) {
      	showMessage('<p class="message-warning">There is no answer yet.</p>');
      } else {
      	var answersText = "";
      	answers.forEach(answer => {
      		answersText += `• ${answer.text} <span class="answer-hash">[${answer.md5}]</span></br>`;
      		console.log("Answer ", answer);
      		highlightCorrectAnswer(answer.md5);
      	});
      	showMessage(`<p class="message-success">The answers are <br/>${answersText}</p>`);
      }
    });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  	switch (request.message) {
  		case "clicked_browser_action": 
  				console.log("clicked_browser_action");
  				break;
  		default: 
  				console.log("unknown command " + request.message);
  				break;
  	}
  }
);
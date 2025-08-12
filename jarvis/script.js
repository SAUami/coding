let lastCommand = "";
    let synth = window.speechSynthesis;
    let recognition;

    const responseArea = document.getElementById("responseArea");

    if ("webkitSpeechRecognition" in window) {
      recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-IN"; // good for English, Hindi, Punjabi

      recognition.onresult = function(event) {
        let transcript = event.results[event.resultIndex][0].transcript.trim().toLowerCase();
        if (transcript === lastCommand) return;
        lastCommand = transcript;
        handleCommand(transcript);
      };

      recognition.onerror = function(event) {
        console.error("Speech recognition error:", event.error);
      };

      recognition.onend = function() {
        recognition.start(); // auto-restart
      };
    } else {
      alert("Speech recognition not supported in this browser.");
    }

    function startListening() {
      lastCommand = "";
      recognition.start();
      speak("Jarvis activated, I am listening.");
      responseArea.innerHTML = "Listening...";
    }

    function speak(text, lang = "en-US") {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      synth.speak(utter);
    }

    function handleCommand(command) {
      let response = "";
      let lang = "en-US";

      if (command.includes("hi jarvis") || command.includes("hello")) {
        response = "Hello sir, how can I assist you?";
      } else if (command.includes("how are you")) {
        response = "I'm fine, how can I assist you?";
      } else if (command.includes("open youtube")) {
        window.open("https://www.youtube.com");
        response = "Opening YouTube.";
      } else if (command.includes("open google")) {
        window.open("https://www.google.com");
        response = "Opening Google.";
      } else if (command.includes("open chatgpt")) {
        window.open("https://chat.openai.com");
        response = "Opening ChatGPT.";
      } else if (command.includes("open linkedin")) {
        window.open("https://www.linkedin.com");
        response = "Opening LinkedIn.";
      } else if (command.includes("open instagram")) {
        window.open("https://www.instagram.com");
        response = "Opening Instagram.";
      } else if (command.includes("open facebook")) {
        window.open("https://www.facebook.com");
        response = "Opening Facebook.";
      } else if (command.includes("open whatsapp web")) {
        window.open("https://web.whatsapp.com");
        response = "Opening WhatsApp Web.";
      } else if (command.includes("open unstop")) {
        window.open("https://unstop.com");
        response = "Opening Unstop.";
      } else if (command.includes("open blackbox ai")) {
        window.open("https://www.blackbox.ai");
        response = "Opening Blackbox AI.";
      } else if (command.includes("open google gemini")) {
        window.open("https://gemini.google.com");
        response = "Opening Google Gemini.";
      } else if (command.includes("open deepseek")) {
        window.open("https://deepseek.com");
        response = "Opening Deepseek.";
      }

      // Hindi
      else if (command.includes("namaste") || command.includes("kaise ho")) {
        response = "Namaste! Main theek hoon, aap kaise ho?";
        lang = "hi-IN";
      }

      // Punjabi
      else if (command.includes("ki haal aa") || command.includes("sat sri akaal")) {
        response = "Sat Sri Akaal! Main vadiya haan, tusi dasso?";
        lang = "pa-IN";
      }

      // French
      else if (command.includes("bonjour") || command.includes("ça va")) {
        response = "Bonjour! Je suis Jarvis, comment puis-je vous aider?";
        lang = "fr-FR";
      }

      else {
        response = "Sorry, I didn't understand that.";
      }

      responseArea.innerHTML = response;
      speak(response, lang);
    }

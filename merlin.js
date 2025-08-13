    const express = require('express');
    const path = require('path');
    const axios = require('axios');
    const bodyParser = require('body-parser');
    const fs = require('fs'); 

    const app = express();
    const port = 3000;

    const GEMINI_API_KEY = "ENTER_YOUR_GEMINI_API_KEY"; // Use your actual key here!
    const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

    let chatbotKnowledgeContent = "";
    const DATA_FOLDER_PATH = path.join(__dirname, 'data');

    const loadChatbotKnowledge = () => {
        fs.readdir(DATA_FOLDER_PATH, (err, files) => {
            if (err) {
                console.error(`Error reading data folder at ${DATA_FOLDER_PATH}:`, err);
                console.warn("Chatbot will not have document-based knowledge until this is fixed.");
                return;
            }

            let combinedContent = "";
            const textFiles = files.filter(file => file.endsWith('.txt'));

            if (textFiles.length === 0) {
                console.warn("No .txt files found in the 'data' folder. Chatbot will only answer general questions.");
            }

            let filesProcessed = 0;
            textFiles.forEach(file => {
                const filePath = path.join(DATA_FOLDER_PATH, file);
                fs.readFile(filePath, 'utf8', (readErr, data) => {
                    filesProcessed++;
                    if (readErr) {
                        console.error(`Error reading file ${file}:`, readErr);
                    } else {
                        combinedContent += `--- Start of ${file} ---\n${data}\n--- End of ${file} ---\n\n`;
                    }

                    if (filesProcessed === textFiles.length) {
                        chatbotKnowledgeContent = combinedContent.trim();
                        if (chatbotKnowledgeContent) {
                            console.log("Chatbot knowledge loaded successfully from 'data' folder files.");
                        }
                    }
                });
            });
        });
    };

    loadChatbotKnowledge();

    app.use(bodyParser.json());

    app.use(express.static(path.join(__dirname)));
    app.use('/css', express.static(path.join(__dirname, 'css')));
    app.use('/js', express.static(path.join(__dirname, 'js')));

    // API Endpoint for the chatbot
    app.post('/api/chat', async (req, res) => {
        try {
            const userQuery = req.body.userQuery;

            if (!userQuery) {
                return res.status(400).json({ error: 'Missing userQuery' });
            }

            // Construct the prompt allowing for the general questions
            let prompt;
            if (chatbotKnowledgeContent) {
                prompt = `You are a helpful AI assistant for "BOM tech solutions". You can answer questions based on the provided document content and also general knowledge questions. If a question is specifically about our products/services, prioritize the document content.

                Document Content:
                ${chatbotKnowledgeContent}

                User Query: ${userQuery}`;
            } else {
                prompt = `You are a helpful AI assistant for "BOM tech solutions". Answer general knowledge questions.

                User Query: ${userQuery}`;
            }


            const geminiResponse = await axios.post(`${GEMINI_API_BASE_URL}?key=${GEMINI_API_KEY}`, {
                contents: [{
                    parts: [{ text: prompt }]
                }]
            });

            const botResponse = geminiResponse.data.candidates[0].content.parts[0].text;
            res.json({ response: botResponse });

        } catch (error) {
            console.error('Error proxying to Gemini API:', error.response ? error.response.data : error.message);
            res.status(500).json({ error: "Failed to get response from AI. Please try again later." });
        }
    });

    // Send index.html file for the root URL
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    // Start the server
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
        console.log(`Open your browser to http://localhost:${port}`);
    });
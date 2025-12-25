const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { parse } = require('papaparse'); // For CSV parsing
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/upload', upload.array('files'), async (req, res) => {
    const filesData = await Promise.all(req.files.map(file => {
        return new Promise((resolve, reject) => {
            fs.readFile(file.path, (err, data) => {
                if (err) reject(err);
                parse(data.toString(), {
                    complete: (result) => resolve(result.data),
                    header: true
                });
            });
        });
    }));

    const [data1, data2] = filesData;
    const topGainers = analyzeStocks(data1, data2, 'gainers');
    const topLosers = analyzeStocks(data1, data2, 'losers');

    res.json({ topGainers, topLosers });
});

function analyzeStocks(data1, data2, type) {
    // Combine data and calculate gainers and losers
    const combinedData = [...data1, ...data2]; // Adjust as necessary
    const results = {};

    combinedData.forEach(stock => {
        const key = stock.symbol;
        results[key] = (results[key] || 0) + parseFloat(stock.change); // Adjust field names
    });

    const sorted = Object.entries(results).sort((a, b) => b[1] - a[1]);
    return type === 'gainers' ? sorted.slice(0, 10) : sorted.slice(-10);
}

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

const express = require('express');
const router = express.Router();
const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql');


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pass',
    database: 'the_joy_of_painting'
});

router.get('/', (req, res) => {
    const pname = 'p.painting_name';
    const cname = 'c.color_name';
    const sname = 's.subject_name';
    const cid = 'pc.color_id';
    const sid = 'ps.subject_id';
    let query = `SELECT p.id, p.painting_name FROM paintings p LEFT JOIN painting_colors pc ON (p.id = pc.painting_id) LEFT JOIN colors c on (pc.color_id = c.id) LEFT JOIN painting_subjects ps ON (p.id = ps.painting_id) LEFT JOIN subjects s on (ps.subject_id = s.id)`;
    let parameters = 0;
    if (req.query.month) {
        parameters += 1;
        let month = req.query.month;
        let queryMonth = ` WHERE month_aired = '${month}'`;
        query = query+queryMonth;
    }
    if (req.query.color) {
        parameters += 1;
        let color = req.query.color;
        let queryColor;
        if (parameters > 1) {
            queryColor = ` AND c.color_name = '${color}'`;
        } else {
            queryColor = ` WHERE c.color_name = '${color}'`;
        }
        query = query+queryColor;
    }
    if (req.query.subject) {
        parameters += 1;
        let subject = req.query.subject.toUpperCase();
        let querySubject;
        if (parameters > 1) {
            querySubject = ` AND s.subject_name = '${subject}'`;
        } else {
            querySubject = ` WHERE s.subject_name = '${subject}'`;
        }
        query = query+querySubject;
    }
    connection.query(query, (err, results) => {
        if (err) throw err;
        let ids = [];
        for (row of results) {
            if (!(row.id in ids)) {
                ids.push(row.id);
            }
        }
        idSet = new Set(ids);
        ids = Array.from(idSet);
        const finalQuery = `SELECT * FROM paintings p LEFT JOIN painting_colors pc ON (p.id = pc.painting_id) LEFT JOIN colors c ON (pc.color_id = c.id) LEFT JOIN painting_subjects ps ON (ps.painting_id = p.id) LEFT JOIN subjects s ON (s.id = ps.subject_id) WHERE p.id IN (${ids})`;
        connection.query(finalQuery, (err, results) => {
            let data = {};
            for (const result of results) {
                if (!(Object.keys(data).includes(result.painting_name))) {
                    data[result.painting_name] = {
                        title: result.painting_name,
                        image: result.image_src,
                        episode: `S${result.season}E${result.episode_number}`,
                        video: result.video,
                        date: result.date_aired,
                        index: result.painting_index,
                        colors: [],
                        subjects: []
                    }
                }
                if (!(data[result.painting_name].colors.includes(result.color_name))) {
                    data[result.painting_name].colors.push(result.color_name);
                }
                if (!(data[result.painting_name].subjects.includes(result.subject_name))) {
                    data[result.painting_name].subjects.push(result.subject_name);
                }
            }
            res.json(data);
        })
    })
});

module.exports = router;
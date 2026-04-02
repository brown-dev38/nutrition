const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
    const intent = req.body.queryResult.intent.displayName;

    // =========================
    // STEP 1: เริ่มต้น
    // =========================
    if (intent === "start_nutrition") {
        return res.json({
            fulfillmentMessages: [
                {
                    text: {
                        text: ["กรุณาใส่ปริมาณอาหาร (ml)"]
                    }
                }
            ]
        });
    }

    // =========================
    // STEP 2: รับค่า ml
    // =========================
    if (intent === "input_volume") {
        const volume = req.body.queryResult.queryText;

        if (isNaN(volume)) {
            return res.json({
                fulfillmentText: "กรุณาใส่ตัวเลข เช่น 250"
            });
        }

        return res.json({
            fulfillmentMessages: [
                {
                    platform: "LINE",
                    message: {
                        type: "text",
                        text: "เลือกความเข้มข้น",
                        quickReply: {
                            items: [
                                { type: "action", action: { type: "message", label: "1:1", text: "1" } },
                                { type: "action", action: { type: "message", label: "1.2:1", text: "1.2" } },
                                { type: "action", action: { type: "message", label: "1.5:1", text: "1.5" } },
                                { type: "action", action: { type: "message", label: "2:1", text: "2" } }
                            ]
                        }
                    }
                }
            ],
            outputContexts: [
                {
                    name: req.body.session + "/contexts/await_concentration",
                    lifespanCount: 5,
                    parameters: {
                        volume: Number(volume)
                    }
                }
            ]
        });
    }

    // =========================
    // STEP 3: คำนวณ
    // =========================
    if (intent === "input_concentration") {
        const concentration = Number(req.body.queryResult.queryText);

        const context = req.body.queryResult.outputContexts.find(ctx =>
            ctx.name.includes("await_concentration")
        );

        if (!context) {
            return res.json({
                fulfillmentText: "กรุณาเริ่มใหม่"
            });
        }

        const volume = context.parameters.volume;

        const energy = volume * concentration;

        return res.json({
            fulfillmentMessages: [
                {
                    platform: "LINE",
                    message: {
                        type: "flex",
                        altText: "ผลการคำนวณ",
                        contents: {
                            type: "bubble",
                            body: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    {
                                        type: "text",
                                        text: "ผลการคำนวณพลังงาน",
                                        weight: "bold",
                                        size: "lg"
                                    },
                                    {
                                        type: "text",
                                        text: `${volume} × ${concentration} = ${energy} kcal`,
                                        margin: "md"
                                    }
                                ]
                            },
                            footer: {
                                type: "box",
                                contents: [
                                    {
                                        type: "button",
                                        action: {
                                            type: "message",
                                            label: "คำนวณใหม่",
                                            text: "ประเมินโภชนาการ"
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            ]
        });
    }

    // =========================
    // DEFAULT
    // =========================
    return res.json({
        fulfillmentText: "ไม่เข้าใจคำสั่ง"
    });
});

app.listen(3000, () => {
    console.log("Webhook running on port 3000");
});
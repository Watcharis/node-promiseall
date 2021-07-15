 
// let nodepromise1 = "http://localhost:4567/nodepromise1"
// let nodepromise2 = "http://localhost:4567/nodepromise2"
// let nodepromise3 = "http://localhost:4567/nodepromise3"
// let nodepromise4 = "http://localhost:4567/nodepromise4"
 
// await Promise.all([
//     testAxios(nodepromise1),
//     testAxios(nodepromise2),
//     testAxios(nodepromise3),
//     testAxios(nodepromise4),
// ]).then((values) => {
//     console.log("values :", values)
//     const data = values.map(x => x.data.data)
//     console.log("data :", data)
//     res.status(200).json({message: "ok", status: "success", data: data})
// })


// POST quanta1.manageai.co.th:<port-number>/prediction
// POST quanta1.manageai.co.th/ai/tuberculosis/cpu/prediction
// {"image_base64": <base64-string>}
// 5004 = pneumothorax
// 5000 = tuberculosis
// 5005 = emphysema
// 5006 = pneumonia
// [5004, 5000, 5005, 5006]
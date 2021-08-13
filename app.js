const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
      district_id: dbObject.districtId,
      district_name: dbObject.districtName,
      stateId: dbObject.state_id,
      cases: dbObject.cases,
      cured : dbObject.cured,
      active: dbObject.active,
      deaths: dbObject.deaths,
  };
};

//API 1

app.get("/states/", async (request, response) => {
    const getStatesQuery = `
        SELECT *
        FROM state;
    `;
    const states = await db.all(getStatesQuery);
   response.send(states.map((eachState) => 
        convertStateDbObjectToResponseObject(eachState);
    )
    );
});

//API 2

app.get("/states/:stateId/", async (request, response) => {
    const { stateId } = request.params;
    const getAStateQuery = `
        SELECT *
        FROM state
        WHERE state_id = ${stateId};
    `;
    const state = await db.get(getAStateQuery);
    response.send(convertStateDbObjectToResponseObject(state));
});

//API 3

app.post("/districts/", async (request, response) => {
    const {stateId, districtName, cases, cured, active, deaths} = request.body;
    const postADistrictQuery = `
        INSERT INTO 
        district(state_id, district_name, cases, cured, active, deaths)
        VALUES 
            (${stateId}, '${districtName}',${cases},${cured},${active},${deaths})
    `;
    await db.run(postADistrictQuery);
    response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params;
    const getADistrictQuery = `
        SELECT *
        FROM district
        WHERE district_id = ${districtId};
    `;
    const district = await db.get(getADistrictQuery);
    response.send(convertDistrictDbObjectToResponseObject(district));
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params;
    const deleteADistrictQuery = `
        DELETE
        FROM district
        WHERE district_id = ${districtId};
    `;
    await db.run(deleteADistrictQuery);
    response.send("District Removed");
});

//API 6

app.put("/districts/:districtId/", async (request, response) => {
    const {districtName,stateId, cases, cured, active, deaths} = request.body;
    const { districtId } = request.params;
    const updateADistrictQuery = `
        UPDATE 
            district 
        SET 
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths},
        WHERE district_id = ${districtId};
    `;
    await db.run(updateADistrictQuery);
    response.send("District Details Updated");
});

//API 7 Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
// {
//   totalCases: 724355,
//   totalCured: 615324,
//   totalActive: 99254,
//   totalDeaths: 9777
// }

app.get("/states/:stateId/stats/", async (request, response) => {
    const { stateId } = request.params;
    const getTotalsQuery = `
        SELECT 
            SUM(cases), SUM(cured), SUM(active), SUM(deaths)
        FROM district
        WHERE state_id = ${stateId};
     `;
    const totals = await db.get(getTotalsQuery);
    response.send({
        totalCases: totals["SUM(cases)"],
        totalCured: totals["SUM(cured)"],
        totalActive: totals["SUM(active)"],
        totalDeaths: totals["SUM(deaths)"]
    });
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
    const {districtId} = request.params;
    const getStateQuery = `
        SELECT state_name
        FROM district INNER JOIN state ON
            district.state_id = state.state_id
        WHERE district_id = ${districtId};
    `;
    const stateOfDistrict = await db.get(getStateQuery);
    response.send({stateName: stateOfDistrict.state_name});
});

module.exports = app;
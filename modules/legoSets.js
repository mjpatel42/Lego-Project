//const setData = require("../data/setData");
//const themeData = require("../data/themeData");
require('dotenv').config();
const Sequelize = require('sequelize');
// connection 
const PGHOST='ep-misty-limit-a5v67gqy.us-east-2.aws.neon.tech'
const PGDATABASE='SenecaDB'
const PGUSER='SenecaDB_owner'
const PGPASSWORD='kGfpK0PW2CdJ'
const ENDPOINT_ID='ep-misty-limit-a5v67gqy'



const sequelize = new Sequelize(PGDATABASE, PGUSER, PGPASSWORD, {
  host: PGHOST,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // This line is necessary if you are using self-signed certificates
    }
  },
  define: {
    timestamps: false // Disable createdAt and updatedAt fields
  }
});

// Define Theme model
const Theme = sequelize.define('Theme', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: Sequelize.STRING
});

// Define Set model
const Set = sequelize.define('Set', {
  set_num: { type: Sequelize.STRING, primaryKey: true },
  name: Sequelize.STRING,
  year: Sequelize.INTEGER,
  num_parts: Sequelize.INTEGER,
  theme_id: Sequelize.INTEGER,
  img_url: Sequelize.STRING
});

// Define association
Set.belongsTo(Theme, { foreignKey: 'theme_id' });

// Function to initialize database and insert existing data
async function initialize() {
  try {
    // Authenticate with the database
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Synchronize models with the database
    await sequelize.sync();

    console.log("Database synchronized successfully.");

  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Function to get all sets
async function getAllSets() {
  try {
    const allSets = await Set.findAll({ include: [Theme] });
    return allSets;
  } catch (error) {
    throw new Error('Error fetching sets: ' + error.message);
  }
}

// Function to get set by set number
async function getSetByNum(setNum) {
  try {
    const set = await Set.findOne({ 
      where: { set_num: setNum },
      include: [Theme]
    });
    if (set) {
      return set;
    } else {
      throw new Error('Unable to find requested set');
    }
  } catch (error) {
    throw new Error('Error fetching set: ' + error.message);
  }
}

// Function to get sets by theme
async function getSetsByTheme(theme) {
  try {
    const sets = await Set.findAll({
      include: [{
        model: Theme,
        where: {
          name: {
            [Sequelize.Op.iLike]: `%${theme}%` // Case-insensitive search for theme name
          }
        }
      }]
    });
    if (sets.length > 0) {
      return sets;
    } else {
      throw new Error('Unable to find requested sets');
    }
  } catch (error) {
    throw new Error('Error fetching sets by theme: ' + error.message);
  }
}

// Function to add a new set
async function addSet(setData) {
  try {
    const newSet = await Set.create(setData);
    return newSet;
  } catch (error) {
    throw new Error('Error adding set: ' + error.message);
  }
}

// Function to edit an existing set
async function editSet(set_num, setData) {
  try {
    await Set.update(setData, { where: { set_num: set_num } });
  } catch (error) {
    throw new Error('Error editing set: ' + error.message);
  }
}

// Function to update a set
async function updateSet(setNum, newData) {
  try {
    // Find the set by set number
    const set = await Set.findOne({ where: { set_num: setNum } });

    // Update the set with new data
    if (set) {
      await set.update(newData);
      console.log('Set updated successfully');
    } else {
      throw new Error(`Set with set number ${setNum} not found`);
    }
  } catch (error) {
    throw new Error(`Error updating set: ${error}`);
  }
}

// Function to delete an existing set
async function deleteSet(setNum) {
  try {
    const deletedSetCount = await Set.destroy({ where: { set_num: setNum } });
    if (deletedSetCount === 0) {
      throw new Error('Set not found');
    }
  } catch (error) {
    throw new Error('Error deleting set: ' + error.message);
  }
}

// Function to get all themes
async function getAllThemes() {
  try {
    const themes = await Theme.findAll();
    return themes;
  } catch (error) {
    throw new Error('Error fetching themes: ' + error.message);
  }
}

module.exports = { 
  initialize, 
  getAllSets, 
  getSetByNum, 
  getSetsByTheme, 
  addSet, 
  editSet, 
  getAllThemes, 
  updateSet,
  deleteSet
};
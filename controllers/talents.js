// Models
import TalentModel from "../model/talent.model.js";
import LanguageModel from "../model/language.model.js";

// Plugins

// Utils
import {
  defaultConfig,
  deleteMedia,
  deleteMultipleMedia,
  storeMediaToDB,
} from "../utils/index.js";

// ===================== GET ===================

/** GET: http://localhost:8080/api/talents 
 * @param : {
  "limit" : 10,
  "skip" : 0,
  "language": "English",
  "gender": "Female",
  "height": "5-6",
  "age": "2000-2010"
}
*/
export async function getTalents(req, res) {
  try {
    const { limit, skip, language, projects, gender, height, age } = req.query;
    let query = {};

    if (language) {
      const languageArr = language.split(",");
      // Fetch language document by title
      const selectedLanguages = await LanguageModel.find({
        title: { $in: languageArr },
      });

      if (!selectedLanguages) {
        return res.status(404).json({ msg: "Language not found" });
      }

      const languageIds = selectedLanguages.map((language) => language._id);

      // Add condition to the query object to filter talents by languageIds
      if (languageIds.length > 0) {
        query.languageSpoken = { $in: languageIds };
      }
    }

    if (gender) {
      query.gender = gender;
    }

    if (height) {
      const heightRange = height.split("-");

      if (heightRange.length === 1) {
        query.height = Number(heightRange[0]);
      } else {
        query.height = {
          $gte: Number(heightRange[0]),
          $lte: Number(heightRange[1]),
        };
      }
    }

    if (age) {
      const ageRange = age.split("-");

      if (ageRange.length === 1) {
        query.birthYear = Number(ageRange[0]);
      } else {
        query.birthYear = {
          $gte: Number(ageRange[0]),
          $lte: Number(ageRange[1]),
        };
      }
    }

    if (projects) {
      query.projects = projects;
    }

    const talents = await TalentModel.find(query)
      .populate("introVideo thumbnail")
      .limit(limit || defaultConfig.fetchLimit)
      .skip(skip || 0);

    return res.status(200).json({ talents });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Failed to retrieve talents" });
  }
}

/** GET: http://localhost:8080/api/talentfilters 
 * @param : {
  "limit" : 10,
  "skip" : 0,
}
*/
export async function getTalentsNameAndId(req, res) {
  try {
    const { limit, skip } = req.query;
    const talents = await TalentModel.find()
      .limit(limit || defaultConfig.fetchLimit)
      .skip(skip || 0)
      .select("name");

    return res.status(200).json({ talents });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Failed to retrieve talents" });
  }
}

/** GET: http://localhost:8080/api/talents/asd2d
 * @param : {}
 */
export async function getTalent(req, res) {
  try {
    const { name } = req.params;

    const talent = await TalentModel.findOne({ name }).populate(
      "introVideo thumbnail"
    );

    if (!talent) {
      return res.status(404).json({ error: "Talent not found!" });
    }

    return res.status(200).json({ talent });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Failed to retrieve talents" });
  }
}

// ===================== POST ===================

/** POST: http://localhost:8080/api/talents 
 * @body : {
    "name": "test",
    "birthYear": 1980,
    "thumbnail": "thumbnail.com/img",
    "introVideo": "introVideo.com/intro",
    "gender": "Female",
    "height": 5.1,
    "email": "test@gmail.com",
    "phone": "1234567890",
    "withApplause": "True"
}
*/
export async function createTalent(req, res) {
  const data = req.body;

  const { name } = req.body;

  let media = {};

  try {
    const existingTalent = await TalentModel.findOne({ name });

    if (existingTalent) {
      return res.status(409).json({ error: "Talent already exists" });
    }

    if (req.files) {
      if (req.files.thumbnail && req.files.introVideo) {
        await Promise.all([
          storeMediaToDB(req.files.thumbnail, "Image", name),
          storeMediaToDB(req.files.introVideo, "Video", name),
        ]).then((values) => {
          media.thumbnail = values[0]._id;
          media.introVideo = values[1]._id;
        });
      } else if (req.files.thumbnail) {
        const result = await storeMediaToDB(req.files.thumbnail, "Image", name);
        media.thumbnail = result._id;
      } else if (req.files.introVideo) {
        const result = await storeMediaToDB(
          req.files.introVideo,
          "Video",
          name
        );
        media.introVideo = result._id;
      }
    }

    await TalentModel.create({ ...data, ...media });

    return res.status(200).json({ ...data, ...media });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Something went wrong!", error });
  }
}

// ===================== PUT ===================

/** PUT: http://localhost:8080/api/talents/asd1d
 * @body : {
    "name": "test",
    "birthYear": 1980,
    "thumbnail": "thumbnail.com/img",
    "introVideo": "introVideo.com/intro",
    "gender": "Female",
    "height": 5.1,
    "email": "test@gmail.com",
    "phone": "1234567890"
}
*/
export async function updateOneTalent(req, res) {
  try {
    const { name } = req.params;
    const data = req.body;

    let media = {};

    const talent = await TalentModel.findOne({ name }).populate(
      "introVideo thumbnail"
    );

    if (!talent) {
      return res
        .status(404)
        .json({ error: "Talent not found!, Please provide correct Name" });
    }

    if (req.files) {
      if (req.files.thumbnail && req.files.introVideo) {
        await deleteMultipleMedia([talent.thumbnail, talent.introVideo]);
        await Promise.all([
          storeMediaToDB(req.files.thumbnail, "Image", name),
          storeMediaToDB(req.files.introVideo, "Video", name),
        ]).then((values) => {
          media.thumbnail = values[0]._id;
          media.introVideo = values[1]._id;
        });
      } else if (req.files.thumbnail) {
        await deleteMedia(talent.thumbnail);
        const result = await storeMediaToDB(req.files.thumbnail, "Image", name);
        media.thumbnail = result._id;
      } else if (req.files.introVideo) {
        await deleteMedia(talent.introVideo);
        const result = await storeMediaToDB(
          req.files.introVideo,
          "Video",
          name
        );
        media.introVideo = result._id;
      }
    }

    await TalentModel.updateOne({ name }, { ...data, ...media });

    return res.status(200).json({ msg: `Record updated for ${name}` });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Something went wrong!", error });
  }
}

// ===================== DELETE ===================

/** DELETE: http://localhost:8080/api/talents/asd1d
 * @param : {}
 */
export async function deleteOneTalent(req, res) {
  try {
    const { name } = req.params;

    const talent = await TalentModel.findOne({ name });

    if (!talent) {
      return res.status(404).json({ error: "Talent not found!" });
    }

    await TalentModel.findOne({ name }).deleteOne();

    if (talent.thumbnail && talent.introVideo) {
      await deleteMultipleMedia([talent.thumbnail, talent.introVideo]);
    } else if (talent.thumbnail) {
      await deleteMedia(talent.thumbnail);
    } else if (talent.introVideo) {
      await deleteMedia(talent.introVideo);
    }

    return res.status(200).json({ msg: `Entry for ${name} is removed` });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Something went wrong!", error });
  }
}

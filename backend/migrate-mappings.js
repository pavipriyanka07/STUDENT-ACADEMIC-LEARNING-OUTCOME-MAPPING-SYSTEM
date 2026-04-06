const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('./config/db');
const Mapping = require('./models/Mapping');
const CourseOutcome = require('./models/CourseOutcome');

dotenv.config();

const migrate = async () => {
  try {
    await connectDB();

    const legacy = await Mapping.collection.find({
      $or: [
        { coId: { $exists: true } },
        { poId: { $exists: true } },
        { mappingLevel: { $exists: true } }
      ]
    }).toArray();

    if (!legacy.length) {
      console.log('No legacy mappings found.');
      await disconnectDB();
      process.exit(0);
    }

    let updated = 0;
    for (const doc of legacy) {
      const courseOutcome = doc.courseOutcome || doc.coId;
      const programOutcome = doc.programOutcome || doc.poId;
      const level = doc.level ?? doc.mappingLevel ?? 0;

      let subject = doc.subject;
      if (!subject && courseOutcome) {
        const co = await CourseOutcome.findById(courseOutcome).select('subject');
        subject = co?.subject;
      }

      const set = {
        courseOutcome,
        programOutcome,
        level: Number(level),
        subject
      };
      await Mapping.collection.updateOne({ _id: doc._id }, { $set: set, $unset: { coId: '', poId: '', mappingLevel: '' } });
      updated += 1;
    }

    console.log(`Migrated ${updated} mappings.`);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    await disconnectDB().catch(() => {});
    process.exit(1);
  }
};

migrate();

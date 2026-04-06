const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Course = require('./models/Course');
const Subject = require('./models/Subject');
const CourseOutcome = require('./models/CourseOutcome');
const ProgramOutcome = require('./models/ProgramOutcome');
const Mapping = require('./models/Mapping');
const Mark = require('./models/Mark');

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany(),
      Course.deleteMany(),
      Subject.deleteMany(),
      CourseOutcome.deleteMany(),
      ProgramOutcome.deleteMany(),
      Mapping.deleteMany(),
      Mark.deleteMany()
    ]);

    await User.create({ username: 'admin', password: 'admin123', role: 'Admin' });
    await User.create({ username: 'faculty1', password: 'faculty123', role: 'Faculty' });

    const course = await Course.create({
      name: 'Bachelor of Computer Science',
      code: 'BCS',
      department: 'Computer Science',
      duration: 4,
      description: 'Undergraduate computer science program'
    });

    const subject = await Subject.create({
      course: course._id,
      name: 'Data Structures',
      code: 'CS201',
      semester: 3,
      credits: 4
    });

    const co1 = await CourseOutcome.create({
      subject: subject._id,
      code: 'CO1',
      description: 'Apply linear and non-linear data structures to solve computing problems',
      targetPercentage: 50,
      totalStudents: 50,
      studentsAchievedTarget: 40
    });

    const co2 = await CourseOutcome.create({
      subject: subject._id,
      code: 'CO2',
      description: 'Analyze algorithm complexity and select optimized solutions',
      targetPercentage: 50,
      totalStudents: 50,
      studentsAchievedTarget: 28
    });

    const [po1, po2, po3] = await ProgramOutcome.insertMany([
      { code: 'PO1', description: 'Engineering knowledge', course: course._id },
      { code: 'PO2', description: 'Problem analysis', course: course._id },
      { code: 'PO3', description: 'Design/development of solutions', course: course._id }
    ]);

    await Mapping.insertMany([
      { subject: subject._id, courseOutcome: co1._id, programOutcome: po1._id, level: 3 },
      { subject: subject._id, courseOutcome: co1._id, programOutcome: po2._id, level: 2 },
      { subject: subject._id, courseOutcome: co2._id, programOutcome: po2._id, level: 3 },
      { subject: subject._id, courseOutcome: co2._id, programOutcome: po3._id, level: 2 }
    ]);

    await Mark.insertMany([
      { studentId: 'S001', subject: subject._id, courseOutcome: co1._id, marks: 42, maxMarks: 50 },
      { studentId: 'S002', subject: subject._id, courseOutcome: co1._id, marks: 34, maxMarks: 50 },
      { studentId: 'S001', subject: subject._id, courseOutcome: co2._id, marks: 28, maxMarks: 50 },
      { studentId: 'S002', subject: subject._id, courseOutcome: co2._id, marks: 18, maxMarks: 50 }
    ]);

    await CourseOutcome.updateOne({ _id: co1._id }, { $set: { totalStudents: 2, studentsAchievedTarget: 2 } });
    await CourseOutcome.updateOne({ _id: co2._id }, { $set: { totalStudents: 2, studentsAchievedTarget: 1 } });

    await disconnectDB();
    console.log('Seed completed');
    console.log('Login -> admin/admin123 or faculty1/faculty123');
    process.exit(0);
  } catch (error) {
    await disconnectDB().catch(() => {});
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  password: { type: String, required: true }
});

export default mongoose.model('User', UserSchema);

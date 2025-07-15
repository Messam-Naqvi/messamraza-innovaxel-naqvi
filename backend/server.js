const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));


const UrlSchema = new mongoose.Schema({
  url: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  accessCount: { type: Number, default: 0 }
});

const Url = mongoose.model('Url', UrlSchema);
const generateShortCode = () => {
  return Math.random().toString(36).substring(2, 8);
};

app.post('/shorten', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const shortCode = generateShortCode();

    const newUrl = new Url({
      url,
      shortCode,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newUrl.save();

    res.status(201).json({
      id: newUrl._id,
      url: newUrl.url,
      shortCode: newUrl.shortCode,
      createdAt: newUrl.createdAt,
      updatedAt: newUrl.updatedAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while creating short URL' });
  }
});

// yaha se retrieve original URL from shortCode
app.get('/shorten/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  if (!shortCode || typeof shortCode !== 'string') {
    return res.status(400).json({ message: 'Invalid short code' });
  }

  try {
    const urlEntry = await Url.findOne({ shortCode });

    if (!urlEntry) {
      return res.status(404).json({ message: 'Short URL not found' });
    }

    urlEntry.accessCount += 1;
    await urlEntry.save();

    res.status(200).json({
      id: urlEntry._id,
      url: urlEntry.url,
      shortCode: urlEntry.shortCode,
      createdAt: urlEntry.createdAt,
      updatedAt: urlEntry.updatedAt,
      accessCount: urlEntry.accessCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while retrieving URL' });
  }
});


// PUT /shorten/:shortCode – Update an existing short URL
app.put('/shorten/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'New URL is required' });
  }

  try {
    const urlEntry = await Url.findOne({ shortCode });

    if (!urlEntry) {
      return res.status(404).json({ message: 'Short URL not found' });
    }

    urlEntry.url = url;
    urlEntry.updatedAt = new Date();

    await urlEntry.save();

    res.status(200).json({
      id: urlEntry._id,
      url: urlEntry.url,
      shortCode: urlEntry.shortCode,
      createdAt: urlEntry.createdAt,
      updatedAt: urlEntry.updatedAt,
      accessCount: urlEntry.accessCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating URL' });
  }
});


app.delete('/shorten/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  if (!shortCode || typeof shortCode !== 'string') {
    return res.status(400).json({ message: 'Invalid short code' });
  }

  try {
    const deleted = await Url.findOneAndDelete({ shortCode });

    if (!deleted) {
      return res.status(404).json({ message: 'Short URL not found' });
    }

    res.status(204).end(); // No Content
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting URL' });
  }
});

app.get('/shorten/:shortCode/stats', async (req, res) => {
  const { shortCode } = req.params;

  if (!shortCode || typeof shortCode !== 'string') {
    return res.status(400).json({ message: 'Invalid short code' });
  }

  try {
    const urlEntry = await Url.findOne({ shortCode });

    if (!urlEntry) {
      return res.status(404).json({ message: 'Short URL not found' });
    }

    res.status(200).json({
      id: urlEntry._id,
      url: urlEntry.url,
      shortCode: urlEntry.shortCode,
      createdAt: urlEntry.createdAt,
      updatedAt: urlEntry.updatedAt,
      accessCount: urlEntry.accessCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

# Credit Card Images Directory

This directory contains images for credit cards displayed in the Credit Optimizer app.

## Default Card Image

The `default-card.svg` file is used as a fallback when:
- No card is selected from the autocomplete
- A card image fails to load
- A custom card name is entered

## Adding Real Card Images

To replace the default placeholder images with actual credit card images:

### 1. Find Card Images

You can obtain card images from:
- **Official bank websites** (check their media/press sections)
- **Credit card review sites** (with proper attribution)
- **Design your own** placeholder images matching your brand

### 2. Image Requirements

- **Format**: PNG or SVG (PNG recommended for photos)
- **Size**: 400x250px (standard credit card aspect ratio ~1.6:1)
- **File size**: Keep under 50KB for fast loading
- **Naming**: Use the exact filename from `src/data/credit-cards.json`

### 3. Example

For the Chase Sapphire Preferred card:

```json
// In credit-cards.json:
{
  "id": "chase-sapphire-preferred",
  "imageUrl": "/cards/chase-sapphire-preferred.png"
}
```

Add the file: `public/cards/chase-sapphire-preferred.png`

### 4. Batch Adding Images

The `src/data/credit-cards.json` file contains 50 popular credit cards. To add images for all:

1. Download or create images for each card
2. Rename them to match the exact filenames in the JSON
3. Place all files in this directory
4. The app will automatically use them

### 5. Testing

After adding images:
1. Run `npm run dev`
2. Go to the calculator page
3. Search for a card in the autocomplete
4. Verify the image appears

## Current Cards in Database

The following cards are defined in `src/data/credit-cards.json`:

- Chase Sapphire Preferred, Reserve, Freedom Unlimited, Freedom Flex
- Amex Platinum, Gold, Blue Cash Preferred, Blue Cash Everyday, Green
- Capital One Venture, Venture X, Savor, Quicksilver
- Discover it Cash Back, it Miles
- Citi Double Cash, Custom Cash, Premier
- Wells Fargo Active Cash, Autograph
- Bank of America Travel Rewards, Unlimited Cash, Customized Cash
- And many more...

See the JSON file for the complete list.

## Legal Considerations

⚠️ **Important**: Ensure you have the right to use any card images you add:

- Credit card images are often trademarked by the issuing banks
- For personal/educational use, this is typically acceptable
- For commercial use, you may need permission from the card issuers
- Consider using generic placeholder designs instead of actual card photos

## Default Image Attribution

The default card image is a generic placeholder created for this project and is free to use.

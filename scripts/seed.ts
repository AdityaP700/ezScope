import { PrismaClient } from '@prisma/client';
import { runComparisonJob } from '../src/server/truthAgent';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    const topic = 'climate-change';
    const textA = "Climate change is the long-term alteration of temperature and typical weather patterns in a place. Human activities, including burning fossil fuels, are the primary cause since the mid-20th century.";
    const textB = "Some scientists argue humans may have a small effect on climate, but natural cycles dominate temperature changes. The sun's activity is the main driver.";

    console.log('Running comparison job for Climate Change...');

    // We can't directly call runComparisonJob here because it uses background processing and we want to wait
    // But for seeding, we can just insert the expected data directly if we wanted,
    // OR we can try to run the logic synchronously.
    // Given the architecture, let's just insert the data directly to ensure the UI has something to show immediately
    // without relying on the job queue for the seed script.

    // 1. Create Knowledge Assets
    const ka1 = await prisma.knowledgeAsset.create({
        data: {
            topic,
            source: 'Wikipedia',
            jsonld: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": topic,
                "author": "Wikipedia",
                "mentions": [
                    { "@type": "Statement", "text": "Human activities are the primary cause of climate change.", "confidence": 0.95 }
                ]
            })
        }
    });

    const ka2 = await prisma.knowledgeAsset.create({
        data: {
            topic,
            source: 'Grokipedia',
            jsonld: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": topic,
                "author": "Grokipedia",
                "mentions": [
                    { "@type": "Statement", "text": "Natural cycles dominate temperature changes.", "confidence": 0.85 }
                ]
            })
        }
    });

    // 2. Create Community Note (Contradiction)
    await prisma.communityNote.create({
        data: {
            topic,
            finding: 'contradiction',
            evidence: JSON.stringify([ka1.id, ka2.id]),
            confidence: 0.92,
            stakedValue: '20',
            reputationScore: 85
        }
    });

    console.log('Seeding completed!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

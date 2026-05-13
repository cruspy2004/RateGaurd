const { redis } = require('./redis');

let leaderId = null;

function startElection() {
    const nodeId = process.env.NODE_ID || 'node-1';
    
    setInterval(async () => {
        try {
            const currentLeader = await redis.get('rg:leader');
            if (!currentLeader) {
                const set = await redis.set('rg:leader', nodeId, 'NX', 'EX', 15);
                if (set) {
                    leaderId = nodeId;
                }
            } else if (currentLeader === nodeId) {
                await redis.expire('rg:leader', 15);
                leaderId = nodeId;
            } else {
                leaderId = currentLeader;
            }
        } catch (e) {
            console.error('Election error', e);
        }
    }, 5000);
}

function getLeaderId() {
    return leaderId;
}

module.exports = { startElection, getLeaderId };

/*
 * Leaderboard placeholder data: edit players and prizes here.
 * players: avatar = image path, or color = initial on a colored circle; me = the current user
 * prizes: icon = Font Awesome icon, minScore = score needed to win
 */
window.QP_LEADERBOARD = {
    players: [
        { name: '9876543210', score: 27340, avatar: 'uploads/user/1/ava-eissa.png' },
        { name: 'Dara', score: 25480, color: '#C4161C' },
        { me: true, score: 22250 },
        { name: 'Sokha', score: 19820, color: '#8A1015' },
        { name: 'Hella', score: 16540, color: '#B83A5E' },
        { name: 'Vibol', score: 12130, color: '#5E5E5E' },
        { name: 'Sophea', score: 8760, color: '#A51419' },
        { name: 'Ratha', score: 5230, color: '#7A7A7A' }
    ],
    prizes: [
        { rank: 1, name: 'Smartphone', icon: 'fa-mobile', minScore: 25000 },
        { rank: 2, name: 'Wireless Earbuds', icon: 'fa-headphones', minScore: 20000 },
        { rank: 3, name: '10GB Data', icon: 'fa-wifi', minScore: 15000 }
    ]
};

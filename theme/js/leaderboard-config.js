/*
 * Leaderboard placeholder data: edit players and prizes here.
 * players: avatar = image path, or color = initial on a colored circle; me = the current user
 * prizes: by final rank when the season ends; image = photo, or icon = Font Awesome icon
 */
window.QP_LEADERBOARD = {
    players: [
        { name: 'Eissa', score: 27340, avatar: 'uploads/user/1/ava-eissa.png' },
        { name: 'Dara', score: 25480, avatar: 'theme/images/avatars/5.svg' },
        { me: true, score: 22250 },
        { name: 'Sokha', score: 19820, avatar: 'theme/images/avatars/2.svg' },
        { name: 'Hella', score: 16540, avatar: 'theme/images/avatars/3.svg' },
        { name: 'Vibol', score: 12130, avatar: 'theme/images/avatars/6.svg' },
        { name: 'Sophea', score: 8760, avatar: 'theme/images/avatars/8.svg' },
        { name: 'Ratha', score: 5230, avatar: 'theme/images/avatars/7.svg' }
    ],
    prizes: [
        { rank: 1, name: 'Smartphone', image: 'lucky-draw/img/prize-phone.jpg' },
        { rank: 2, name: 'Wireless Earbuds', image: 'lucky-draw/img/prize-earbuds.jpg' },
        { rank: 3, name: '10GB Data', icon: 'fa-wifi' }
    ]
};

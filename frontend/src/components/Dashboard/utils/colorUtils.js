export const eventColors = [
    { backgroundColor: '#d1e7ff', borderColor: '#7cb0ff', textColor: '#333' }, // Blue
    { backgroundColor: '#d1ffdb', borderColor: '#7cff9c', textColor: '#333' }, // Green
    { backgroundColor: '#e7d1ff', borderColor: '#b37cff', textColor: '#333' }, // Purple
    { backgroundColor: '#ffd1e7', borderColor: '#ff7cb0', textColor: '#333' }, // Pink
    { backgroundColor: '#fff9d1', borderColor: '#ffe77c', textColor: '#333' }  // Yellow
];

export function getRandomEventColor() {
    const randomIndex = Math.floor(Math.random() * eventColors.length);
    return eventColors[randomIndex];
}

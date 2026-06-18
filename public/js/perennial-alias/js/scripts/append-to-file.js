// Copyright 2023, University of Colorado Boulder
/**
 * Add content to file.
 *
 * @author Liam Mulhall <liammulh@gmail.com>
 */ import { writeFileSync } from 'node:fs';
/**
 * Append the given content to the file.
 *
 * @param {String} pathToFile - path to the file you want to append to
 * @param {String} content - content you want to add to the file
 */ const appendToFile = (pathToFile, content)=>{
    writeFileSync(pathToFile, content, {
        encoding: 'utf-8',
        flag: 'a'
    });
};
export default appendToFile;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9zY3JpcHRzL2FwcGVuZC10by1maWxlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBBZGQgY29udGVudCB0byBmaWxlLlxuICpcbiAqIEBhdXRob3IgTGlhbSBNdWxoYWxsIDxsaWFtbXVsaEBnbWFpbC5jb20+XG4gKi9cblxuaW1wb3J0IHsgd3JpdGVGaWxlU3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuXG4vKipcbiAqIEFwcGVuZCB0aGUgZ2l2ZW4gY29udGVudCB0byB0aGUgZmlsZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFRvRmlsZSAtIHBhdGggdG8gdGhlIGZpbGUgeW91IHdhbnQgdG8gYXBwZW5kIHRvXG4gKiBAcGFyYW0ge1N0cmluZ30gY29udGVudCAtIGNvbnRlbnQgeW91IHdhbnQgdG8gYWRkIHRvIHRoZSBmaWxlXG4gKi9cbmNvbnN0IGFwcGVuZFRvRmlsZSA9ICggcGF0aFRvRmlsZSwgY29udGVudCApID0+IHtcbiAgd3JpdGVGaWxlU3luYyggcGF0aFRvRmlsZSwgY29udGVudCwgeyBlbmNvZGluZzogJ3V0Zi04JywgZmxhZzogJ2EnIH0gKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGFwcGVuZFRvRmlsZTsiXSwibmFtZXMiOlsid3JpdGVGaWxlU3luYyIsImFwcGVuZFRvRmlsZSIsInBhdGhUb0ZpbGUiLCJjb250ZW50IiwiZW5jb2RpbmciLCJmbGFnIl0sIm1hcHBpbmdzIjoiQUFBQSxpREFBaUQ7QUFFakQ7Ozs7Q0FJQyxHQUVELFNBQVNBLGFBQWEsUUFBUSxVQUFVO0FBRXhDOzs7OztDQUtDLEdBQ0QsTUFBTUMsZUFBZSxDQUFFQyxZQUFZQztJQUNqQ0gsY0FBZUUsWUFBWUMsU0FBUztRQUFFQyxVQUFVO1FBQVNDLE1BQU07SUFBSTtBQUNyRTtBQUVBLGVBQWVKLGFBQWEifQ==
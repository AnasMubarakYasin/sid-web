// Copyright 2018-2026, University of Colorado Boulder
/**
 * Represents a specific patch being applied to a repository for maintenance purposes.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ let Patch = class Patch {
    constructor(repo, name, message, shas = []){
        this.repo = repo;
        this.name = name;
        this.message = message;
        this.shas = shas;
    }
    /**
   * Convert into a plain JS object meant for JSON serialization.
   */ serialize() {
        return {
            repo: this.repo,
            name: this.name,
            message: this.message,
            shas: this.shas
        };
    }
    /**
   * Takes a serialized form of the Patch and returns an actual instance.
   */ static deserialize({ repo, name, message, shas }) {
        return new Patch(repo, name, message, shas);
    }
};
export default Patch;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vUGF0Y2gudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogUmVwcmVzZW50cyBhIHNwZWNpZmljIHBhdGNoIGJlaW5nIGFwcGxpZWQgdG8gYSByZXBvc2l0b3J5IGZvciBtYWludGVuYW5jZSBwdXJwb3Nlcy5cbiAqXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICovXG5cbnR5cGUgUGF0Y2hTZXJpYWxpemVkID0ge1xuICByZXBvOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgbWVzc2FnZTogc3RyaW5nO1xuICBzaGFzOiBzdHJpbmdbXTtcbn07XG5cbmNsYXNzIFBhdGNoIGltcGxlbWVudHMgUGF0Y2hTZXJpYWxpemVkIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwdWJsaWMgcmVhZG9ubHkgcmVwbzogc3RyaW5nLCBwdWJsaWMgcmVhZG9ubHkgbmFtZTogc3RyaW5nLCBwdWJsaWMgcmVhZG9ubHkgbWVzc2FnZTogc3RyaW5nLCBwdWJsaWMgcmVhZG9ubHkgc2hhczogc3RyaW5nW10gPSBbXSApIHt9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgaW50byBhIHBsYWluIEpTIG9iamVjdCBtZWFudCBmb3IgSlNPTiBzZXJpYWxpemF0aW9uLlxuICAgKi9cbiAgcHVibGljIHNlcmlhbGl6ZSgpOiBQYXRjaFNlcmlhbGl6ZWQge1xuICAgIHJldHVybiB7XG4gICAgICByZXBvOiB0aGlzLnJlcG8sXG4gICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICBtZXNzYWdlOiB0aGlzLm1lc3NhZ2UsXG4gICAgICBzaGFzOiB0aGlzLnNoYXNcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEgc2VyaWFsaXplZCBmb3JtIG9mIHRoZSBQYXRjaCBhbmQgcmV0dXJucyBhbiBhY3R1YWwgaW5zdGFuY2UuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGRlc2VyaWFsaXplKCB7IHJlcG8sIG5hbWUsIG1lc3NhZ2UsIHNoYXMgfTogUGF0Y2hTZXJpYWxpemVkICk6IFBhdGNoIHtcbiAgICByZXR1cm4gbmV3IFBhdGNoKCByZXBvLCBuYW1lLCBtZXNzYWdlLCBzaGFzICk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGF0Y2g7Il0sIm5hbWVzIjpbIlBhdGNoIiwicmVwbyIsIm5hbWUiLCJtZXNzYWdlIiwic2hhcyIsInNlcmlhbGl6ZSIsImRlc2VyaWFsaXplIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQVNELElBQUEsQUFBTUEsUUFBTixNQUFNQTtJQUNKLFlBQW9CLEFBQWdCQyxJQUFZLEVBQUUsQUFBZ0JDLElBQVksRUFBRSxBQUFnQkMsT0FBZSxFQUFFLEFBQWdCQyxPQUFpQixFQUFFLENBQUc7YUFBbkhILE9BQUFBO2FBQThCQyxPQUFBQTthQUE4QkMsVUFBQUE7YUFBaUNDLE9BQUFBO0lBQXVCO0lBRXhKOztHQUVDLEdBQ0QsQUFBT0MsWUFBNkI7UUFDbEMsT0FBTztZQUNMSixNQUFNLElBQUksQ0FBQ0EsSUFBSTtZQUNmQyxNQUFNLElBQUksQ0FBQ0EsSUFBSTtZQUNmQyxTQUFTLElBQUksQ0FBQ0EsT0FBTztZQUNyQkMsTUFBTSxJQUFJLENBQUNBLElBQUk7UUFDakI7SUFDRjtJQUVBOztHQUVDLEdBQ0QsT0FBY0UsWUFBYSxFQUFFTCxJQUFJLEVBQUVDLElBQUksRUFBRUMsT0FBTyxFQUFFQyxJQUFJLEVBQW1CLEVBQVU7UUFDakYsT0FBTyxJQUFJSixNQUFPQyxNQUFNQyxNQUFNQyxTQUFTQztJQUN6QztBQUNGO0FBRUEsZUFBZUosTUFBTSJ9
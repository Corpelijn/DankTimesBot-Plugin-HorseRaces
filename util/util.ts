

export class Util {

    public static concatNames(names: string[]): string {
        let text = ``;
        for (let i = 0; i < names.length; i++) {
            text += `${names[i]}`;

            if (i === names.length - 2) {
                text += ` and `;
            } else if (i < names.length - 1) {
                text += `, `;
            }
        }
        return text;
    }

    public static getTimeDescription(totalSeconds: number): string {
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;

        let text = ``;
        if (minutes > 0) {
            text += `${minutes} minute`;
            if (minutes > 1) {
                text += `s`;
            }
        }

        if (minutes > 0 && seconds > 0) {
            text += ` and `;
        }

        if (seconds > 0) {
            text += `${seconds} second`;
            if (seconds > 1) {
                text += `s`;
            }
        }

        return text;
    }

    public static shuffle<T>(array: T[]): T[] {
        let currentIndex = array.length,  randomIndex;
    
        // While there remain elements to shuffle.
        while (currentIndex != 0) {
      
          // Pick a remaining element.
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
      
          // And swap it with the current element.
          [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }
      
        return array;
    };

    public static groupBy<TKey, TElem>(list: TElem[], keyGetter: (arg: TElem) => TKey): Map<TKey, TElem[]> {
        const map = new Map<TKey, TElem[]>();
        list.forEach((item) => {
            const key = keyGetter(item);
            const collection = map.get(key);
            if (!collection) {
                map.set(key, [item]);
            } else {
                collection.push(item);
            }
        });
        return map;
    }
}
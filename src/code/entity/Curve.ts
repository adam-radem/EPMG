
export module Curve {
	export function getCurvePoints(points: number[], tension: number = 0.5, numOfSeg: number = 25, close: boolean = false) {
		if (typeof points === "undefined" || points.length < 2) return [0];

		// options or defaults
		tension = typeof tension === "number" ? tension : 0.5;
		numOfSeg = typeof numOfSeg === "number" ? numOfSeg : 25;

		var pts, // for cloning point array
			i = 1,
			l = points.length,
			rPos = 0,
			rLen = (l - 2) * numOfSeg + 2 + (close ? 2 * numOfSeg : 0),
			res = new Array<number>(rLen).fill(0),
			cache = new Array<number>((numOfSeg = 2) << 2).fill(0),
			cachePtr = 4;

		pts = points.slice(0);

		if (close) {
			pts.unshift(points[l - 1]); // insert end point as first point
			pts.unshift(points[l - 2]);
			pts.push(points[0], points[1]); // first point as last point
		}
		else {
			pts.unshift(points[1]); // copy 1. point and insert at beginning
			pts.unshift(points[0]);
			pts.push(points[l - 2], points[l - 1]); // duplicate end-points
		}

		// cache inner-loop calculations as they are based on t alone
		cache[0] = 1; // 1,0,0,0

		for (; i < numOfSeg; i++) {

			var st = i / numOfSeg, st2 = st * st, st3 = st2 * st, st23 = st3 * 2, st32 = st2 * 3;

			cache[cachePtr++] = st23 - st32 + 1; // c1
			cache[cachePtr++] = st32 - st23; // c2
			cache[cachePtr++] = st3 - 2 * st2 + st; // c3
			cache[cachePtr++] = st3 - st2; // c4
		}

		cache[++cachePtr] = 1; // 0,1,0,0


		// calc. points
		parse(pts, cache, l, tension);

		if (close) {
			//l = points.length;
			pts = [];
			pts.push(points[l - 4], points[l - 3],
				points[l - 2], points[l - 1], // second last and last
				points[0], points[1],
				points[2], points[3]); // first and second
			parse(pts, cache, 4, tension);
		}

		function parse(pts: number[], cache: Array<number>, l: number, tension: number) {

			for (var i = 2, t; i < l; i += 2) {

				var pt1 = pts[i], // x1
					pt2 = pts[i + 1], // y1
					pt3 = pts[i + 2], // x2
					pt4 = pts[i + 3], // y2
					t1x = (pt3 - pts[i - 2]) * tension, // x2-x0
					t1y = (pt4 - pts[i - 1]) * tension, // y2-y0
					t2x = (pts[i + 4] - pt1) * tension, // x3-x1
					t2y = (pts[i + 5] - pt2) * tension, // y3-y1
					c = 0, c1, c2, c3, c4;

				for (t = 0; t < numOfSeg; t++) {

					c1 = cache[c++];
					c2 = cache[c++];
					c3 = cache[c++];
					c4 = cache[c++];

					res[rPos++] = c1 * pt1 + c2 * pt3 + c3 * t1x + c4 * t2x;
					res[rPos++] = c1 * pt2 + c2 * pt4 + c3 * t1y + c4 * t2y;
				}
			}
		}

		// add last point
		l = close ? 0 : points.length - 2;
		res[rPos++] = points[l++];
		res[rPos] = points[l];

		return res;
	}
}

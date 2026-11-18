export class PriorityQueue<T> {
  private readonly items: T[] = []

  constructor(private readonly compare: (left: T, right: T) => number) {}

  push(item: T) {
    const items = this.items
    let index = items.length
    items.push(item)
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (this.compare(items[parent], item) <= 0) break
      items[index] = items[parent]
      index = parent
    }
    items[index] = item
  }

  pop(): T | undefined {
    const items = this.items
    const first = items[0]
    const last = items.pop()
    if (!items.length || last === undefined) return first

    let index = 0
    while (index * 2 + 1 < items.length) {
      let child = index * 2 + 1
      if (child + 1 < items.length && this.compare(items[child + 1], items[child]) < 0) child++
      if (this.compare(last, items[child]) <= 0) break
      items[index] = items[child]
      index = child
    }
    items[index] = last
    return first
  }
}

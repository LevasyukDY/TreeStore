const expect = require("chai").expect;

/**
 * Тип для узла дерева
 */
type Node = {
  id: number;
  parent: "root" | number;
  type?: "test" | null;
};

class TreeStore {
  private _tree: Node[]; // исходное дерево
  private _indexedTreeById: Map<number, Node>; // индекс узлов по id
  private _indexedTreeByParent: Map<number | "root", Node | Node[]>; // индекс узлов по родительским узлам, включая "root"

  constructor(tree: Node[]) {
    this._tree = tree;
    this._indexedTreeById = this._toIndexTreeById(tree);
    this._indexedTreeByParent = this._toIndexTreeByParent(tree);
  }

  /**
   * @returns возвращает все узлы дерева
   */
  getAll(): Node[] {
    return this._tree;
  }

  /**
   * @param id идентификатор узла
   * @returns возвращает узел по его идентификатору (id)
   */
  getItem(id: number): Node | undefined {
    return this._indexedTreeById.get(id);
  }

  /**
   * @param id идентификатор узла
   * @returns возвращает дочерние узлы для узла с заданным идентификатором (id)
   */
  getChildren(id: number | "root"): Node | Node[] | undefined {
    const children = this._indexedTreeByParent.get(id);
    if (children) return children;
    else return []; // если нет, возвращаем пустой массив
  }

  /**
   * Метод получения всех потомков с использованием рекурсии
   * @param id идентификатор узла
   * @returns возвращает всех потомков (дочерние узлы, их дочерние узлы и т.д.) узла с заданным идентификатором (id)
   */
  getAllChildren(id: number | "root"): Node | Node[] | undefined {
    let nodes = this.getChildren(id); // получаем дочерние узлы текущего узла
    const arr: Node[] = []; // вспомогательный массив

    if (Array.isArray(nodes)) {
      // если вернулся массив узлов, то для каждого узла вызываем getAllChildren
      nodes.forEach((node) => {
        const child = this.getAllChildren(node.id);
        this._pushNodeToArray(child, arr);
      });
      nodes.push(...arr);
    } else if (nodes && !Array.isArray(nodes)) {
      // если вернулся один узел, то вызываем getAllChildren только для него
      const child = this.getAllChildren(nodes.id);
      this._pushNodeToArray(child, arr);
      arr.unshift(nodes);
      nodes = arr;
    }
    return nodes;
  }

  /**
   * Метод получения всех родителей узла с использованием цикла while
   * @param id идентификатор узла
   * @returns возвращает всех родителей узла с заданным идентификатором (id)
   */
  getAllParents(id: number): Node | Node[] | undefined {
    let parentNode: Node | undefined;
    const nodes: Node[] = [];
    const node = this.getItem(id); // получаем текущий узел

    if (!node) return;

    let parentId = node.parent;
    if (parentId === "root") return;

    // выполняем цикл, пока не дойдём до корневого узла
    while (parentId !== "root") {
      parentNode = this.getItem(parentId); // получаем родительский узел
      if (parentNode) {
        nodes.push(parentNode); // записываем узел в итоговый массив
        parentId = parentNode.parent; // меняем id на новый id родителя
      }
    }
    return nodes;
  }

  /**
   * Помогает добавлять узлы в массив, используемый в методе getAllChildren(),
   * @param child узел или узлы, который(-ые) нужно добавить
   * @param arr массив, в который нужно добавить узлы (child)
   */
  private _pushNodeToArray(
    child: Node | Node[] | undefined,
    arr: Node[]
  ): void {
    if (child && Array.isArray(child)) {
      arr.push(...child); // разворачиваем в arr, если пришёл массив
    } else if (child && !Array.isArray(child)) {
      arr.push(child); // добавляем узел в arr, если пришёл один узел
    }
  }

  /**
   * Помогает индексировать узлы дерева по id
   * @param tree исходное дерево
   * @returns индексированное дерево
   */
  private _toIndexTreeById(tree: Node[]): Map<number, Node> {
    const map: Map<number, Node> = new Map();
    // проходимся по всем узлам в исходном дереве
    for (let node of tree) map.set(node.id, node); // добавляем в качестве ключа id, а значение сам узел
    return map;
  }

  /**
   * Помогает индексировать узлы дерева по родительским узлам
   * @param tree исходное дерево
   * @returns индексированное дерево
   */
  private _toIndexTreeByParent(
    tree: Node[]
  ): Map<number | "root", Node | Node[]> {
    const map = new Map();
    let arr: Node[] = []; // вспомогательный массив
    // проходимся по всем узлам в исходном дереве
    for (let node of tree) {
      // если в коллекции уже есть узел, то добавляем в него новые значения
      if (map.has(node.parent)) {
        arr = [];
        // если в коллекцию записан массив, то распаковываем его в вспомогательный массив
        if (Array.isArray(map.get(node.parent)))
          arr.push(...map.get(node.parent));
        else arr.push(map.get(node.parent)); // иначе добавляем один узел в вспомогательный массив
        arr.push(node); // добавляем новый узел в эту коллекцию
        map.set(node.parent, arr); // записываем в Map
      } else {
        map.set(node.parent, node);
      }
    }
    return map;
  }
}

/*
-------------------- ТЕСТЫ --------------------
*/

describe("Testing methods of the TreeStore class", () => {
  before(function () {
    const items: Node[] = [
      { id: 1, parent: "root" },
      { id: 2, parent: 1, type: "test" },
      { id: 3, parent: 1, type: "test" },
      { id: 4, parent: 2, type: "test" },
      { id: 5, parent: 2, type: "test" },
      { id: 6, parent: 2, type: "test" },
      { id: 7, parent: 4, type: null },
      { id: 8, parent: 4, type: null },
    ];
    this.ts = new TreeStore(items);
  });

  it("getAll()", function () {
    expect(this.ts.getAll()).to.eql([
      { id: 1, parent: "root" },
      { id: 2, parent: 1, type: "test" },
      { id: 3, parent: 1, type: "test" },
      { id: 4, parent: 2, type: "test" },
      { id: 5, parent: 2, type: "test" },
      { id: 6, parent: 2, type: "test" },
      { id: 7, parent: 4, type: null },
      { id: 8, parent: 4, type: null },
    ]);
  });

  it("getItem(7)", function () {
    expect(this.ts.getItem(7)).to.eql({ id: 7, parent: 4, type: null });
  });

  it("getChildren(4)", function () {
    expect(this.ts.getChildren(4)).to.eql([
      { id: 7, parent: 4, type: null },
      { id: 8, parent: 4, type: null },
    ]);
  });

  it("getChildren(5)", function () {
    expect(this.ts.getChildren(5)).to.eql([]);
  });

  it("getChildren(2)", function () {
    expect(this.ts.getChildren(2)).to.eql([
      { id: 4, parent: 2, type: "test" },
      { id: 5, parent: 2, type: "test" },
      { id: 6, parent: 2, type: "test" },
    ]);
  });

  it("getAllChildren(2)", function () {
    expect(this.ts.getAllChildren(2)).to.eql([
      { id: 4, parent: 2, type: "test" },
      { id: 5, parent: 2, type: "test" },
      { id: 6, parent: 2, type: "test" },
      { id: 7, parent: 4, type: null },
      { id: 8, parent: 4, type: null },
    ]);
  });

  it("getAllParents(7)", function () {
    expect(this.ts.getAllParents(7)).to.eql([
      { id: 4, parent: 2, type: "test" },
      { id: 2, parent: 1, type: "test" },
      { id: 1, parent: "root" },
    ]);
  });
});

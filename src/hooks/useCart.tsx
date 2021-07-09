/* eslint-disable no-loop-func */
import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    let hasError = false;
    let alreadyAdded = false;
    try {
      api
        .get(`stock/${productId}`)
        .then((response_stock) => {
          api
            .get(`products/${productId}`)
            .then((response_prod) => {
              const tempArrayOfProducts = [];

              if (cart.length > 0) {
                for (let x = 0; x <= cart.length - 1; x += 1) {
                  if (cart[x].id === productId) {
                    // se já existe, apenas incremente
                    if (response_stock.data.amount - cart[x].amount > 0) {
                      alreadyAdded = true;
                      tempArrayOfProducts.push({
                        id: cart[x].id,
                        title: cart[x].title,
                        price: cart[x].price,
                        image: cart[x].image,
                        amount: cart[x].amount + 1,
                      });
                    } else {
                      // fora de estoque
                      toast.error("Quantidade solicitada fora de estoque");
                      hasError = true;
                    }
                  } else {
                    // se não existe apenas forma o array
                    tempArrayOfProducts.push(cart[x]);
                  }
                }
                if (!hasError) {
                  if (!alreadyAdded) {
                    tempArrayOfProducts.push({
                      id: response_prod.data.id,
                      title: response_prod.data.title,
                      price: response_prod.data.price,
                      image: response_prod.data.image,
                      amount: 1,
                    });
                  }

                  setCart(tempArrayOfProducts);
                  const tempCart = JSON.stringify(tempArrayOfProducts);
                  localStorage.setItem("@RocketShoes:cart", tempCart);
                }
              } else {
                // apenas adiciona
                api.get("products").then((response) => {
                  const arrProd = response.data;
                  for (let x = 0; x <= arrProd.length - 1; x += 1) {
                    if (productId === arrProd[x].id) {
                      setCart([
                        {
                          id: arrProd[x].id,
                          title: arrProd[x].title,
                          price: arrProd[x].price,
                          image: arrProd[x].image,
                          amount: 1,
                        },
                      ]);
                      const tempCart = JSON.stringify([arrProd[x]]);
                      localStorage.setItem("@RocketShoes:cart", tempCart);
                    }
                  }
                });
              }
            })
            .catch((err) => {
              toast.error("Quantidade solicitada fora de estoque");
            });
        })
        .catch((err) => {
          toast.error("Erro na adição do produto");
        });
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    const tempArrayOfProducts = [];
    try {
      let found = cart.find((item) => item["id"] === productId);
      if (found !== undefined) {
        for (let x = 0; x <= cart.length - 1; x += 1) {
          if (cart[x].id !== productId) {
            tempArrayOfProducts.push({
              id: cart[x].id,
              title: cart[x].title,
              price: cart[x].price,
              image: cart[x].image,
              amount: cart[x].amount,
            });
          }
        }
        const tempCart = JSON.stringify(tempArrayOfProducts);
        localStorage.setItem("@RocketShoes:cart", tempCart);
        setCart(tempArrayOfProducts);
      } else {
        toast.error("Erro na remoção do produto");
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return null;
      } else {
        api
          .get(`stock/${productId}`)
          .then((response) => {
            const tempArrayOfProducts = [];

            if (amount > response.data.amount) {
              toast.error("Quantidade solicitada fora de estoque");
            } else {
              for (let x = 0; x <= cart.length - 1; x += 1) {
                if (cart[x].id === productId) {
                  tempArrayOfProducts.push({
                    id: cart[x].id,
                    title: cart[x].title,
                    price: cart[x].price,
                    image: cart[x].image,
                    amount: amount,
                  });
                } else {
                  tempArrayOfProducts.push({
                    id: cart[x].id,
                    title: cart[x].title,
                    price: cart[x].price,
                    image: cart[x].image,
                    amount: cart[x].amount,
                  });
                }
              }
              const tempCart = JSON.stringify(tempArrayOfProducts);
              localStorage.setItem("@RocketShoes:cart", tempCart);
              setCart(tempArrayOfProducts);
            }
          })
          .catch((error) => {
            toast.error("Erro na alteração de quantidade do produto");
          });
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

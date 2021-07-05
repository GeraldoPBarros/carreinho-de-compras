import { createContext, ReactNode, useContext, useState } from "react";
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
    const tempArrayOfProducts = [];
    try {
      if (cart.length > 0) {
        for (let x = 0; x <= cart.length; x += 1) {
          if (cart[x].id === productId) {
            // se já existe, apenas incremente
            api.get("stock").then((response) => {
              if (response.data[productId - 1].amount <= cart[x].amount + 1) {
                tempArrayOfProducts.push({
                  id: cart[x].id,
                  title: cart[x].title,
                  price: cart[x].price,
                  image: cart[x].image,
                  amount: cart[x].amount + 1,
                });
              } else {
                toast.error("Quantidade solicitada fora de estoque");
              }
            });
          } else {
            tempArrayOfProducts.push(cart[x]);
          }
        }
        setCart(tempArrayOfProducts);
        const tempCart = JSON.stringify(tempArrayOfProducts);
        localStorage.setItem("@RocketShoes:cart", tempCart);
      } else {
        // apenas adiciona
        api.get("products").then((response) => {
          const arrProd = response.data;
          for (let x = 0; x <= arrProd.length - 1; x += 1) {
            console.log(productId, arrProd[x].id);
            if (productId === arrProd[x].id) {
              console.log("ACHOU: ", arrProd[x]);
              setCart([arrProd[x]]);
              const tempCart = JSON.stringify([arrProd[x]]);
              localStorage.setItem("@RocketShoes:cart", tempCart);
            }
          }
        });
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    const tempArrayOfProducts = [];
    try {
      for (let x = 0; x <= cart.length; x += 1) {
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
        api.get("stock").then((response) => {
          const tempArrayOfProducts = [];

          if (amount > response.data[productId - 1]) {
            toast.error("Quantidade solicitada fora de estoque");
          } else {
            for (let x = 0; x <= cart.length; x += 1) {
              if (cart[x].id === productId) {
                tempArrayOfProducts.push({
                  id: cart[x].id,
                  title: cart[x].title,
                  price: cart[x].price,
                  image: cart[x].image,
                  amount: amount,
                });
              }
            }
            const tempCart = JSON.stringify(tempArrayOfProducts);
            localStorage.setItem("@RocketShoes:cart", tempCart);
            setCart(tempArrayOfProducts);
          }
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

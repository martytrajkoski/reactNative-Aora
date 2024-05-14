import { Children, createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "../lib/appwrite";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({children}) => {
    const [isLoggedIn, setisLoggedIn] = useState(false);
    const [user, setuser] = useState(null);
    const [isLoading, setisLoading] = useState(true);

    useEffect(() => {
        getCurrentUser()
            .then((res)=>{
                if(res){
                    setisLoggedIn(true);
                    setuser(res)
                    console.log(user)
                }else{
                    setisLoggedIn(false)
                    setuser(null)
                }
            })
            .catch((error) => {
                console.log(error);
            })
            .finally(() => {
                setisLoading(false);
            })
    },[])

    return(
        <GlobalContext.Provider
            value={{
                isLoggedIn,
                setisLoggedIn,
                user,
                setuser,
                isLoading
            }}
        >
            {children}
        </GlobalContext.Provider>
    )
}

export default GlobalProvider;
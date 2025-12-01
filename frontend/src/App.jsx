import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './Pages/Home'
import MarketPlace from './Pages/MarketPlace'
import MyListings from './Pages/MyListings'
import ListingDetails from './Pages/ListingDetails'
import ManageListing from './Pages/ManageListing'
import Messages from './Pages/Messages'
import MyOrder from './Pages/MyOrder'
import Loading from './Pages/Loading'
import { useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import ChatBox from './components/ChatBox'
import {Toaster} from 'react-hot-toast'
import Layout from './Pages/admin/Layout'
import Dashboard from './Pages/admin/Dashboard'
import CredentialVerify from './Pages/admin/CredentialVerify'
import CredentialChange from './Pages/admin/CredentialChange'
import AllListings from './Pages/admin/AllListings'
import Transactions from './Pages/admin/Transactions'
import Withdrawal from './Pages/admin/Withdrawal'

const App = () => {
  const {pathname} = useLocation()
  return (
    <div>
      <Toaster />
      {!pathname.includes('/admin') && <Navbar/>}
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/marketplace' element={<MarketPlace/>}/>
        <Route path='/my-listings' element={<MyListings/>}/>
        <Route path='/listing/:listingId' element={<ListingDetails/>}/>
        <Route path='/create-listing' element={<ManageListing/>}/>
        <Route path='/edit-listing/:id' element={<ManageListing/>}/>
        <Route path='/messages' element={<Messages/>}/>
        <Route path='/my-order' element={<MyOrder/>}/>
        <Route path='/loading' element={<Loading/>}/>
        <Route path='/admin' element={<Layout/>}>
        <Route index element={<Dashboard/>}/>
        <Route path='verify-credentials' element={<CredentialVerify/>}/>
        <Route path='change-credentials' element={<CredentialChange/>}/>
        <Route path='list-listings' element={<AllListings/>}/>
        <Route path='transactions' element={<Transactions/>}/>
        <Route path='withdrawal' element={<Withdrawal/>}/>

        </Route>

      </Routes>
      <ChatBox/>
    </div>
  )
}

export default App

// extension name is es7 react